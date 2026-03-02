'use client';

import React, { FC, useCallback, useEffect, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

interface Brand {
  id: string;
  name: string;
  voicePrompt: string | null;
  languageRules: string | null;
  forbiddenWords: string | null;
  hashtagGroups: string | null;
  examplePosts: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  defaultLanguage: string;
  allowedLanguages: string;
  approvalRequired: boolean;
  isDefault: boolean;
}

const emptyBrand: Omit<Brand, 'id'> = {
  name: '',
  voicePrompt: '',
  languageRules: '',
  forbiddenWords: '',
  hashtagGroups: '',
  examplePosts: '',
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  defaultLanguage: 'sv',
  allowedLanguages: '["sv","en"]',
  approvalRequired: false,
  isDefault: false,
};

export const BrandsComponent: FC = () => {
  const fetch = useFetch();
  const toast = useToaster();
  const t = useT();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editing, setEditing] = useState<(Brand & { isNew?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBrands = useCallback(async () => {
    try {
      const res = await fetch('/brands');
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch (e) {
      setBrands([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBrands();
  }, []);

  const saveBrand = useCallback(async () => {
    if (!editing || !editing.name.trim()) {
      toast.show('Brand name is required', 'warning');
      return;
    }
    try {
      const method = editing.isNew ? 'POST' : 'PUT';
      const url = editing.isNew ? '/brands' : `/brands/${editing.id}`;
      await fetch(url, {
        method,
        body: JSON.stringify({
          name: editing.name,
          voicePrompt: editing.voicePrompt || undefined,
          languageRules: editing.languageRules || undefined,
          forbiddenWords: editing.forbiddenWords || undefined,
          hashtagGroups: editing.hashtagGroups || undefined,
          examplePosts: editing.examplePosts || undefined,
          primaryColor: editing.primaryColor || undefined,
          secondaryColor: editing.secondaryColor || undefined,
          defaultLanguage: editing.defaultLanguage || 'sv',
          allowedLanguages: editing.allowedLanguages || '["sv","en"]',
          approvalRequired: editing.approvalRequired,
          isDefault: editing.isDefault,
        }),
      });
      toast.show(editing.isNew ? 'Brand created' : 'Brand updated');
      setEditing(null);
      loadBrands();
    } catch (e) {
      toast.show('Failed to save brand', 'warning');
    }
  }, [editing]);

  const deleteBrand = useCallback(async (id: string) => {
    if (!confirm('Delete this brand?')) return;
    try {
      await fetch(`/brands/${id}`, { method: 'DELETE' });
      toast.show('Brand deleted');
      if (editing?.id === id) setEditing(null);
      loadBrands();
    } catch (e) {
      toast.show('Failed to delete brand', 'warning');
    }
  }, [editing]);

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading brands...</div>;
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editing.isNew ? 'New Brand' : `Edit: ${editing.name}`}
          </h2>
          <button
            onClick={() => setEditing(null)}
            className="text-sm text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Brand Name *</span>
            <input
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="bg-black/20 border border-gray-700 rounded px-3 py-2 text-sm"
              placeholder="e.g. PlastShop, HeartPro, ARC Gruppen"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Voice Prompt</span>
            <textarea
              value={editing.voicePrompt || ''}
              onChange={(e) => setEditing({ ...editing, voicePrompt: e.target.value })}
              className="bg-black/20 border border-gray-700 rounded px-3 py-2 text-sm min-h-[80px]"
              placeholder="Describe the brand's tone of voice, personality, and communication style..."
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Language Rules</span>
            <textarea
              value={editing.languageRules || ''}
              onChange={(e) => setEditing({ ...editing, languageRules: e.target.value })}
              className="bg-black/20 border border-gray-700 rounded px-3 py-2 text-sm min-h-[60px]"
              placeholder="Specific grammar, spelling, or style rules..."
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Forbidden Words</span>
            <input
              type="text"
              value={editing.forbiddenWords || ''}
              onChange={(e) => setEditing({ ...editing, forbiddenWords: e.target.value })}
              className="bg-black/20 border border-gray-700 rounded px-3 py-2 text-sm"
              placeholder="Comma-separated: word1, word2, word3"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Hashtag Groups</span>
            <input
              type="text"
              value={editing.hashtagGroups || ''}
              onChange={(e) => setEditing({ ...editing, hashtagGroups: e.target.value })}
              className="bg-black/20 border border-gray-700 rounded px-3 py-2 text-sm"
              placeholder="#industry #brand #campaign"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Example Posts</span>
            <textarea
              value={editing.examplePosts || ''}
              onChange={(e) => setEditing({ ...editing, examplePosts: e.target.value })}
              className="bg-black/20 border border-gray-700 rounded px-3 py-2 text-sm min-h-[80px]"
              placeholder="Paste 2-3 example posts that represent this brand's style..."
            />
          </label>

          <div className="flex gap-4">
            <label className="flex flex-col gap-1 flex-1">
              <span className="text-sm text-gray-400">Default Language</span>
              <select
                value={editing.defaultLanguage}
                onChange={(e) => setEditing({ ...editing, defaultLanguage: e.target.value })}
                className="bg-black/20 border border-gray-700 rounded px-3 py-2 text-sm"
              >
                <option value="sv">Svenska</option>
                <option value="en">English</option>
                <option value="no">Norsk</option>
                <option value="fi">Suomi</option>
                <option value="da">Dansk</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 flex-1">
              <span className="text-sm text-gray-400">Primary Color</span>
              <input
                type="color"
                value={editing.primaryColor || '#000000'}
                onChange={(e) => setEditing({ ...editing, primaryColor: e.target.value })}
                className="bg-black/20 border border-gray-700 rounded h-[38px] w-full cursor-pointer"
              />
            </label>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.approvalRequired}
                onChange={(e) => setEditing({ ...editing, approvalRequired: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Require approval before publishing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.isDefault}
                onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Default brand</span>
            </label>
          </div>
        </div>

        <button
          onClick={saveBrand}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm font-medium mt-2"
        >
          {editing.isNew ? 'Create Brand' : 'Save Changes'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('brands', 'Brands')}</h2>
        <button
          onClick={() =>
            setEditing({ ...emptyBrand, id: '', isNew: true } as Brand & { isNew: boolean })
          }
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1.5 text-sm"
        >
          + New Brand
        </button>
      </div>

      {brands.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="mb-2">No brands configured yet.</p>
          <p className="text-sm">Create a brand to customize AI-generated content with your voice, language rules, and style.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-between bg-black/10 border border-gray-700/50 rounded-lg px-4 py-3 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                {brand.primaryColor && (
                  <div
                    className="w-4 h-4 rounded-full border border-gray-600"
                    style={{ backgroundColor: brand.primaryColor }}
                  />
                )}
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {brand.name}
                    {brand.isDefault && (
                      <span className="text-xs bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                    {brand.approvalRequired && (
                      <span className="text-xs bg-yellow-600/30 text-yellow-300 px-1.5 py-0.5 rounded">
                        Approval
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {brand.defaultLanguage.toUpperCase()}
                    {brand.voicePrompt && ` · Voice configured`}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(brand)}
                  className="text-sm text-gray-400 hover:text-white px-2 py-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteBrand(brand.id)}
                  className="text-sm text-red-400 hover:text-red-300 px-2 py-1"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
