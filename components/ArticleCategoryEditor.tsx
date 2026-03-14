
import React, { useState } from 'react';
import { ArticleCategory, Article } from '../types';
import { Icon } from './Icon';

interface ArticleCategoryEditorProps {
    categories: ArticleCategory[];
    onChange: (categories: ArticleCategory[]) => void;
}

export const ArticleCategoryEditor: React.FC<ArticleCategoryEditorProps> = ({ categories, onChange }) => {
    const [newCategoryName, setNewCategoryName] = useState('');

    const handleCategoryNameChange = (index: number, newName: string) => {
        const newCategories = [...categories];
        newCategories[index].name = newName;
        onChange(newCategories);
    };

    const addCategory = () => {
        if (newCategoryName.trim() === '') return;
        onChange([...categories, { name: newCategoryName, items: [] }]);
        setNewCategoryName('');
    };
    
    const deleteCategory = (index: number) => {
        const newCategories = categories.filter((_, i) => i !== index);
        onChange(newCategories);
    };

    const handleArticleChange = (catIndex: number, itemIndex: number, field: keyof Article, value: string | number) => {
        const newCategories = [...categories];
        (newCategories[catIndex].items[itemIndex] as any)[field] = value;
        onChange(newCategories);
    };

    const addArticle = (catIndex: number) => {
        const newCategories = [...categories];
        const newArticle: Article = {
            id: `ART-${Date.now()}`,
            name: '',
            price: 0,
            description: ''
        };
        newCategories[catIndex].items.push(newArticle);
        onChange(newCategories);
    };

    const deleteArticle = (catIndex: number, itemIndex: number) => {
        const newCategories = [...categories];
        newCategories[catIndex].items = newCategories[catIndex].items.filter((_, i) => i !== itemIndex);
        onChange(newCategories);
    };


    return (
        <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
            {categories.map((category, catIndex) => (
                <div key={catIndex} className="p-3 border rounded bg-white">
                    <div className="flex items-center justify-between mb-2">
                         <input
                            type="text"
                            value={category.name}
                            onChange={(e) => handleCategoryNameChange(catIndex, e.target.value)}
                            placeholder="Nom de la catégorie (ex: Hauts)"
                            className="font-semibold text-lg border-b-2 p-1 focus:border-brand-blue outline-none"
                        />
                        <button type="button" onClick={() => deleteCategory(catIndex)} className="p-1 text-red-500 hover:bg-red-100 rounded-full">
                            <Icon name="xmark" className="w-5 h-5"/>
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {category.items.map((item, itemIndex) => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => handleArticleChange(catIndex, itemIndex, 'name', e.target.value)}
                                    placeholder="Nom de l'article"
                                    className="col-span-4 p-1 border rounded text-sm"
                                />
                                <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => handleArticleChange(catIndex, itemIndex, 'description', e.target.value)}
                                    placeholder="Description (optionnel)"
                                    className="col-span-5 p-1 border rounded text-sm"
                                />
                                <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => handleArticleChange(catIndex, itemIndex, 'price', parseFloat(e.target.value) || 0)}
                                    placeholder="Prix"
                                    className="col-span-2 p-1 border rounded text-sm"
                                />
                                <button type="button" onClick={() => deleteArticle(catIndex, itemIndex)} className="col-span-1 p-1 text-red-500 hover:bg-red-100 rounded-full justify-self-center">
                                     <Icon name="xmark" className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => addArticle(catIndex)} className="mt-2 text-sm text-brand-blue font-semibold hover:underline">
                        + Ajouter un article
                    </button>
                </div>
            ))}
            
            <div className="flex space-x-2 pt-4 border-t">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nom de la nouvelle catégorie"
                    className="flex-grow p-2 border rounded-lg"
                />
                <button type="button" onClick={addCategory} className="px-4 py-2 bg-brand-dark text-white font-semibold rounded-lg whitespace-nowrap">
                    Ajouter Catégorie
                </button>
            </div>
        </div>
    );
};
