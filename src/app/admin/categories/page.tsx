'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DbCategory } from '@/lib/supabase/types';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FolderTree
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [editingCategory, setEditingCategory] = useState<Partial<DbCategory> | null>(null);
  const [isNewCategory, setIsNewCategory] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form Fields
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const fetchCategories = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('[Admin Categories] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateModal = () => {
    setIsNewCategory(true);
    setId('');
    setLabel('');
    setIcon('Utensils');
    setSubtitle('');
    setDescription('');
    setImageUrl('');
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setEditingCategory({});
  };

  const openEditModal = (cat: DbCategory) => {
    setIsNewCategory(false);
    setId(cat.id);
    setLabel(cat.label);
    setIcon(cat.icon || 'Utensils');
    setSubtitle(cat.subtitle || '');
    setDescription(cat.description || '');
    setImageUrl(cat.image_url || '');
    setSortOrder(cat.sort_order);
    setIsActive(cat.is_active);
    setEditingCategory(cat);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const payload = {
      label: label.trim(),
      icon: icon.trim() || 'Utensils',
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      sort_order: Number(sortOrder) || 0,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isNewCategory) {
        const cleanId = (id || label).toLowerCase().replace(/[^a-z0-9]/g, '_');
        const { error } = await supabase.from('menu_categories').insert({
          id: cleanId,
          ...payload,
        });
        if (error) throw error;
        setFeedback({ type: 'success', message: `Category "${label}" created!` });
      } else if (editingCategory?.id) {
        const { error } = await supabase
          .from('menu_categories')
          .update(payload)
          .eq('id', editingCategory.id);
        if (error) throw error;
        setFeedback({ type: 'success', message: `Category "${label}" updated!` });
      }

      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save category.' });
    } finally {
      setIsSaving(false);
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const currentCat = categories[index];
    const targetCat = categories[targetIndex];

    const tempOrder = currentCat.sort_order;
    currentCat.sort_order = targetCat.sort_order;
    targetCat.sort_order = tempOrder;

    // Optimistic reorder
    const updated = [...categories];
    updated[index] = targetCat;
    updated[targetIndex] = currentCat;
    setCategories(updated);

    try {
      await Promise.all([
        supabase
          .from('menu_categories')
          .update({ sort_order: currentCat.sort_order })
          .eq('id', currentCat.id),
        supabase
          .from('menu_categories')
          .update({ sort_order: targetCat.sort_order })
          .eq('id', targetCat.id),
      ]);
    } catch (err) {
      console.error('[Admin Categories] Reorder error:', err);
      fetchCategories();
    }
  };

  const handleDeleteCategory = async (cat: DbCategory) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    // Check if category has items
    const { count } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', cat.id);

    if (count && count > 0) {
      alert(`Cannot delete category "${cat.label}" because it contains ${count} dishes. Please reassign or delete the dishes first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${cat.label}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('menu_categories').delete().eq('id', cat.id);
      if (error) throw error;
      setFeedback({ type: 'success', message: `Deleted category "${cat.label}".` });
      fetchCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete category.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Category Management
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Organize menu sections, customize subtitles, and reorder presentation order
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-chili-600 hover:bg-chili-700 active:scale-95 transition-all shadow-md shadow-chili-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories List */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-400">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
          <FolderTree className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            No categories defined yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                {/* Reorder Buttons */}
                <div className="flex flex-col space-y-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveCategory(index, 'up')}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900 disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === categories.length - 1}
                    onClick={() => moveCategory(index, 'down')}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900 disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-serif font-bold text-base text-gray-900 dark:text-white">
                      {cat.label}
                    </h3>
                    <code className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                      ID: {cat.id}
                    </code>
                    {!cat.is_active && (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                        Hidden
                      </span>
                    )}
                  </div>
                  {cat.subtitle && (
                    <p className="text-xs text-chili-600 dark:text-chili-400 font-medium mt-0.5">
                      {cat.subtitle}
                    </p>
                  )}
                  {cat.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 self-end sm:self-center">
                <span className="text-xs text-gray-400 font-mono pr-2">
                  Order #{cat.sort_order}
                </span>
                <button
                  type="button"
                  onClick={() => openEditModal(cat)}
                  className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Edit category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat)}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-chili-600">
                {isNewCategory ? 'New Category' : 'Edit Category'}
              </span>
              <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
                {isNewCategory ? 'Create Menu Category' : `Edit "${label}"`}
              </h3>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              {isNewCategory && (
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    Category ID (slug) *
                  </label>
                  <input
                    type="text"
                    required
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="e.g. mocktails, desserts"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Category Label *
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Mocktails & Coolers"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Subtitle Banner
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. 5 Refreshing Drinks • Starting at ₹89"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of this category..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    Icon Name
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="e.g. Utensils, Flame"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Visible on public website
                </span>
              </label>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-white font-bold bg-chili-600 hover:bg-chili-700 shadow-sm flex items-center space-x-1.5 disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Category</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
