import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { shuffle } from 'lodash';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { AiProviderService } from '@gitroom/nestjs-libraries/database/prisma/brands/ai-provider.service';
import { BrandService } from '@gitroom/nestjs-libraries/database/prisma/brands/brand.service';

const fallbackOpenai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-proj-',
});

const PROVIDER_BASE_URLS: Record<string, string> = {
  GROQ: 'https://api.groq.com/openai/v1',
  OLLAMA: 'http://host.docker.internal:11434/v1',
};

const DEFAULT_MODELS: Record<string, string> = {
  OPENAI: 'gpt-4.1',
  GROQ: 'llama-3.3-70b-versatile',
  ANTHROPIC: 'claude-sonnet-4-20250514',
  OLLAMA: 'llama3',
  CUSTOM: 'gpt-4.1',
};

const PicturePrompt = z.object({
  prompt: z.string(),
});

const VoicePrompt = z.object({
  voice: z.string(),
});

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);

  constructor(
    private _aiProviderService: AiProviderService,
    private _brandService: BrandService
  ) {}

  private async getClient(orgId?: string): Promise<{ client: OpenAI; model: string }> {
    if (orgId) {
      try {
        const provider = await this._aiProviderService.getDefaultProvider(orgId);
        if (provider) {
          const baseURL = provider.baseUrl || PROVIDER_BASE_URLS[provider.providerType];
          const models = provider.models ? JSON.parse(provider.models) : {};
          const model = models.default || DEFAULT_MODELS[provider.providerType] || 'gpt-4.1';
          return {
            client: new OpenAI({
              apiKey: provider.apiKey,
              ...(baseURL ? { baseURL } : {}),
            }),
            model,
          };
        }
      } catch (e) {
        this.logger.warn('Failed to load AI provider from DB, falling back to env');
      }
    }
    return { client: fallbackOpenai, model: 'gpt-4.1' };
  }

  private static readonly ANTI_AI_FINGERPRINT = `
CRITICAL WRITING RULES — follow these strictly to produce natural, human-sounding text:
- Vary sentence length dramatically: mix 3-word punches with 25-word flowing sentences.
- Never open with "In today's", "In the world of", "Are you looking for", "It's important to note", or any generic AI opener.
- Use concrete numbers, names, and specifics instead of vague qualifiers ("increased 34%" not "significantly improved").
- Include industry jargon and colloquialisms appropriate for the audience.
- Occasionally use incomplete sentences. Or one-word paragraphs. Works great.
- Avoid these AI-telltale words: utilize, leverage, landscape, navigate, elevate, delve, foster, robust, streamline, seamless, cutting-edge, game-changer, holistic, synergy.
- Start some sentences with "And", "But", "So", or "Look,".
- Use contractions naturally (don't, won't, it's, we're).
- Add a light personal opinion or mild controversy when appropriate — AI text is always safely neutral.
- Never use more than one exclamation mark in the entire text.
- Keep hashtags to max 3-5, placed naturally, not dumped at the end.`;

  private async getBrandContext(orgId?: string, brandId?: string): Promise<string> {
    if (!orgId) return OpenaiService.ANTI_AI_FINGERPRINT;
    try {
      const brand = brandId
        ? await this._brandService.getBrandById(orgId, brandId)
        : await this._brandService.getDefaultBrand(orgId);

      const parts: string[] = [OpenaiService.ANTI_AI_FINGERPRINT];

      if (brand) {
        if (brand.voicePrompt) parts.push(`Brand voice: ${brand.voicePrompt}`);
        if (brand.languageRules) parts.push(`Language rules: ${brand.languageRules}`);
        if (brand.forbiddenWords) parts.push(`Forbidden words (never use these in addition to the AI-telltale words above): ${brand.forbiddenWords}`);
        if (brand.examplePosts) parts.push(`Example posts to match this style:\n${brand.examplePosts}`);
        if (brand.hashtagGroups) parts.push(`Approved hashtag groups: ${brand.hashtagGroups}`);
        if (brand.defaultLanguage) parts.push(`Write in language: ${brand.defaultLanguage}`);
      }

      return `\n\n${parts.join('\n')}`;
    } catch (e) {
      return OpenaiService.ANTI_AI_FINGERPRINT;
    }
  }

  async generateImage(prompt: string, isUrl: boolean, isVertical = false, orgId?: string) {
    const { client } = await this.getClient(orgId);
    const generate = (
      await client.images.generate({
        prompt,
        response_format: isUrl ? 'url' : 'b64_json',
        model: 'dall-e-3',
        ...(isVertical ? { size: '1024x1792' } : {}),
      })
    ).data[0];

    return isUrl ? generate.url : generate.b64_json;
  }

  async generatePromptForPicture(prompt: string, orgId?: string) {
    const { client, model } = await this.getClient(orgId);
    return (
      (
        await client.chat.completions.parse({
          model,
          messages: [
            {
              role: 'system',
              content: `You are an assistant that take a description and style and generate a prompt that will be used later to generate images, make it a very long and descriptive explanation, and write a lot of things for the renderer like, if it${"'"}s realistic describe the camera`,
            },
            {
              role: 'user',
              content: `prompt: ${prompt}`,
            },
          ],
          response_format: zodResponseFormat(PicturePrompt, 'picturePrompt'),
        })
      ).choices[0].message.parsed?.prompt || ''
    );
  }

  async generateVoiceFromText(prompt: string, orgId?: string) {
    const { client, model } = await this.getClient(orgId);
    return (
      (
        await client.chat.completions.parse({
          model,
          messages: [
            {
              role: 'system',
              content: `You are an assistant that takes a social media post and convert it to a normal human voice, to be later added to a character, when a person talk they don\'t use "-", and sometimes they add pause with "..." to make it sounds more natural, make sure you use a lot of pauses and make it sound like a real person`,
            },
            {
              role: 'user',
              content: `prompt: ${prompt}`,
            },
          ],
          response_format: zodResponseFormat(VoicePrompt, 'voice'),
        })
      ).choices[0].message.parsed?.voice || ''
    );
  }

  async generatePosts(content: string, orgId?: string, brandId?: string) {
    const { client, model } = await this.getClient(orgId);
    const brandContext = await this.getBrandContext(orgId, brandId);

    const posts = (
      await Promise.all([
        client.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content:
                'Generate a Twitter post from the content without emojis in the following JSON format: { "post": string } put it in an array with one element' + brandContext,
            },
            {
              role: 'user',
              content: content!,
            },
          ],
          n: 5,
          temperature: 1,
          model,
        }),
        client.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content:
                'Generate a thread for social media in the following JSON format: Array<{ "post": string }> without emojis' + brandContext,
            },
            {
              role: 'user',
              content: content!,
            },
          ],
          n: 5,
          temperature: 1,
          model,
        }),
      ])
    ).flatMap((p) => p.choices);

    return shuffle(
      posts.map((choice) => {
        const { content } = choice.message;
        const start = content?.indexOf('[')!;
        const end = content?.lastIndexOf(']')!;
        try {
          return JSON.parse(
            '[' +
              content
                ?.slice(start + 1, end)
                .replace(/\n/g, ' ')
                .replace(/ {2,}/g, ' ') +
              ']'
          );
        } catch (e) {
          return [];
        }
      })
    );
  }
  async extractWebsiteText(content: string, orgId?: string, brandId?: string) {
    const { client, model } = await this.getClient(orgId);
    const websiteContent = await client.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'You take a full website text, and extract only the article content',
        },
        {
          role: 'user',
          content,
        },
      ],
      model,
    });

    const { content: articleContent } = websiteContent.choices[0].message;

    return this.generatePosts(articleContent!, orgId, brandId);
  }

  async separatePosts(content: string, len: number, orgId?: string) {
    const { client, model } = await this.getClient(orgId);

    const SeparatePostsPrompt = z.object({
      posts: z.array(z.string()),
    });

    const SeparatePostPrompt = z.object({
      post: z.string().max(len),
    });

    const posts =
      (
        await client.chat.completions.parse({
          model,
          messages: [
            {
              role: 'system',
              content: `You are an assistant that take a social media post and break it to a thread, each post must be minimum ${
                len - 10
              } and maximum ${len} characters, keeping the exact wording and break lines, however make sure you split posts based on context`,
            },
            {
              role: 'user',
              content: content,
            },
          ],
          response_format: zodResponseFormat(
            SeparatePostsPrompt,
            'separatePosts'
          ),
        })
      ).choices[0].message.parsed?.posts || [];

    return {
      posts: await Promise.all(
        posts.map(async (post: any) => {
          if (post.length <= len) {
            return post;
          }

          let retries = 4;
          while (retries) {
            try {
              return (
                (
                  await client.chat.completions.parse({
                    model,
                    messages: [
                      {
                        role: 'system',
                        content: `You are an assistant that take a social media post and shrink it to be maximum ${len} characters, keeping the exact wording and break lines`,
                      },
                      {
                        role: 'user',
                        content: post,
                      },
                    ],
                    response_format: zodResponseFormat(
                      SeparatePostPrompt,
                      'separatePost'
                    ),
                  })
                ).choices[0].message.parsed?.post || ''
              );
            } catch (e) {
              retries--;
            }
          }

          return post;
        })
      ),
    };
  }

  async generateSlidesFromText(text: string, orgId?: string) {
    const { client, model } = await this.getClient(orgId);
    for (let i = 0; i < 3; i++) {
      try {
        const message = `You are an assistant that takes a text and break it into slides, each slide should have an image prompt and voice text to be later used to generate a video and voice, image prompt should capture the essence of the slide and also have a back dark gradient on top, image prompt should not contain text in the picture, generate between 3-5 slides maximum`;
        const parse =
          (
            await client.chat.completions.parse({
              model,
              messages: [
                {
                  role: 'system',
                  content: message,
                },
                {
                  role: 'user',
                  content: text,
                },
              ],
              response_format: zodResponseFormat(
                z.object({
                  slides: z
                    .array(
                      z.object({
                        imagePrompt: z.string(),
                        voiceText: z.string(),
                      })
                    )
                    .describe('an array of slides'),
                }),
                'slides'
              ),
            })
          ).choices[0].message.parsed?.slides || [];

        return parse;
      } catch (err) {
        console.log(err);
      }
    }

    return [];
  }

  async generateBlogPost(topic: string, orgId?: string, brandId?: string) {
    const { client, model } = await this.getClient(orgId);
    const brandContext = await this.getBrandContext(orgId, brandId);

    const BlogPostSchema = z.object({
      title: z.string(),
      metaDescription: z.string().max(160),
      content: z.string(),
      tags: z.array(z.string()).max(5),
    });

    for (let i = 0; i < 3; i++) {
      try {
        const result = await client.chat.completions.parse({
          model,
          messages: [
            {
              role: 'system',
              content: `You are an expert content writer. Write a long-form blog post (800-1500 words) in Markdown format.
Structure: compelling title, meta description (max 160 chars), well-structured body with H2/H3 headings, and 3-5 relevant tags.
The body should have an engaging intro, 3-5 sections with subheadings, and a conclusion with a call to action.
Use short paragraphs (2-3 sentences max). Include bullet points or numbered lists where appropriate.${brandContext}`,
            },
            {
              role: 'user',
              content: `Write a blog post about: ${topic}`,
            },
          ],
          response_format: zodResponseFormat(BlogPostSchema, 'blogPost'),
        });

        return result.choices[0].message.parsed;
      } catch (err) {
        this.logger.warn(`Blog post generation attempt ${i + 1} failed`);
      }
    }

    return null;
  }

  async repurposeContent(content: string, platforms: string[], orgId?: string, brandId?: string) {
    const { client, model } = await this.getClient(orgId);
    const brandContext = await this.getBrandContext(orgId, brandId);

    const RepurposedSchema = z.object({
      posts: z.array(z.object({
        platform: z.string(),
        content: z.string(),
        hashtags: z.array(z.string()).max(5),
      })),
    });

    try {
      const result = await client.chat.completions.parse({
        model,
        messages: [
          {
            role: 'system',
            content: `You are a social media expert. Take a long-form article and create unique, platform-optimized posts for each requested platform.
Each post should have a different angle/hook — never just shorten the same text.
Platform rules:
- X/Twitter: max 280 chars, punchy, conversational
- LinkedIn: professional, 1-3 short paragraphs, end with a question or CTA
- Facebook: casual, relatable, slightly longer
- Instagram: visual-first caption, line breaks for readability, hashtags natural
- Threads: conversational, thread-friendly${brandContext}`,
          },
          {
            role: 'user',
            content: `Create posts for these platforms: ${platforms.join(', ')}\n\nSource content:\n${content}`,
          },
        ],
        response_format: zodResponseFormat(RepurposedSchema, 'repurposed'),
      });

      return result.choices[0].message.parsed;
    } catch (err) {
      this.logger.warn('Content repurposing failed');
      return null;
    }
  }
}
