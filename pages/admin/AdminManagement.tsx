import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, AdminSection, AdminPermissions } from '../../types';
import { Icon } from '../../components/Icon';

const PermissionToggle: React.FC<{
    label: string;
    description: string;
    isChecked: boolean;
    onToggle: () => void;
}> = ({ label, description, isChecked, onToggle }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{label}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={isChecked} onChange={onToggle} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
        </label>
    </div>
);

const AdminPermissionsEditor: React.FC<{ admin: User; onSave: (userId: string, permissions: AdminPermissions) => void; onCancel: () => void; }> = ({ admin, onSave, onCancel }) => {
    const { t } = useAppContext();
    const allPermissionKeys = useMemo(() => Object.keys(t('adminAdminManagement.permissions', { returnObjects: true })) as AdminSection[], [t]);

    const initialPermissions = useMemo(() => {
        const perms: AdminPermissions = {} as any;
        allPermissionKeys.forEach(key => {
            (perms as any)[key] = admin.permissions?.includes(key) ?? false;
        });
        return perms;
    }, [admin.permissions, allPermissionKeys]);

    const [permissions, setPermissions] = useState<AdminPermissions>(initialPermissions);

    const handleToggle = (key: AdminSection) => {
        setPermissions(prev => ({...prev, [key]: !prev[key]}));
    };
    
    const permissionDetails = t('adminAdminManagement.permissions', { returnObjects: true });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">{t('adminAdminManagement.editingFor', { name: admin.name })}</h2>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    <div className="space-y-4">
                        {allPermissionKeys.map((key) => {
                            // FIX: Safely access the `description` property from the i1next translation object, which can sometimes be a string instead of an object.
                            const detail = permissionDetails[key as AdminSection];
                            const description = (typeof detail === 'object' && detail.description) ? detail.description : '';
                            return (
                                <PermissionToggle
                                    key={key}
                                    label={t(`adminPage.${key}`, { default: key })}
                                    description={description}
                                    isChecked={permissions[key as keyof AdminPermissions]}
                                    onToggle={() => handleToggle(key as AdminSection)}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="flex justify-end space-x-2 p-6 border-t dark:border-slate-700">
                    <button onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-lg">{t('buttons.cancel')}</button>
                    <button onClick={() => onSave(admin.id, permissions)} className="px-4 py-2 bg-brand-success text-white rounded-lg">{t('adminAdminManagement.saveButton')}</button>
                </div>
            </div>
        </div>
    );
};


export const AdminManagement: React.FC = () => {
    const { user, getAllUsers, addAdmin, apiUpdateUserPermissions, t, addNotification } = useAppContext();
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<User | null>(null);

    const admins = useMemo(() => {
        return getAllUsers().filter(u => (u.role === 'admin' || u.role === 'superadmin') && u.id !== user?.id);
    }, [getAllUsers, user]);

    const handleSavePermissions = async (userId: string, permissions: AdminPermissions) => {
        setIsLoading(true);
        try {
            await apiUpdateUserPermissions(userId, permissions);
            addNotification(t('notifications.permissionsUpdated'), 'success');
            setEditingAdmin(null);
        } catch (error) {
            addNotification(t('notifications.permissionsUpdateError'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // FIX: Corrected an incorrect type annotation that was causing a type error.
            const initialPermissions: Partial<AdminPermissions> = {
              dashboard: true, analytics: false, partners: false, services: false, users: false,
              orders: false, drivers: false, promotions: false, advertisements: false, loyalty: false,
              referral: false, content: false, support: false, adminManagement: false, tracking: false,
              subscriptions: false, refunds: false, activity: false
            };
            await addAdmin({ ...formData, permissions: Object.keys(initialPermissions).filter(k => (initialPermissions as any)[k]) });
            setFormData({ name: '', email: '', phone: '', password: '' });
            setIsFormVisible(false);
        } catch (error) {
            // Error notification is handled by the context function
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('adminAdminManagement.title')}</h1>
                {!isFormVisible && (
                     <button onClick={() => setIsFormVisible(true)} className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90 flex items-center space-x-2">
                        <Icon name="user" className="w-5 h-5"/>
                        <span>{t('adminAdminManagement.newAdminButton')}</span>
                    </button>
                )}
            </div>

            {isFormVisible && (
                <div className="bg-white p-6 rounded-2xl shadow-card">
                    <h2 className="text-2xl font-bold mb-4">{t('adminAdminManagement.newAdminFormTitle')}</h2>
                    <form onSubmit={handleAddAdmin} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={t('adminAdminManagement.adminName')} required className="w-full p-2 border rounded-lg"/>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder={t('loginPage.email')} required className="w-full p-2 border rounded-lg"/>
                            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder={t('registerPage.phone')} required className="w-full p-2 border rounded-lg"/>
                            <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={t('adminAdminManagement.tempPassword')} required className="w-full p-2 border rounded-lg"/>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button type="button" onClick={() => setIsFormVisible(false)} className="px-4 py-2 text-sm bg-slate-200 rounded-lg">{t('buttons.cancel')}</button>
                            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm text-white bg-brand-success rounded-lg">{isLoading ? t('buttons.loading') : t('adminAdminManagement.createButton')}</button>
                        </div>
                    </form>
                </div>
            )}
            
            <div className="bg-white p-6 rounded-2xl shadow-card">
                <h2 className="text-2xl font-bold mb-4">{t('adminAdminManagement.existingAdmins')}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-6 py-3">{t('adminAdminManagement.adminName')}</th>
                                <th className="px-6 py-3">{t('loginPage.email')}</th>
                                <th className="px-6 py-3">{t('adminAdminManagement.role')}</th>
                                <th className="px-6 py-3 text-right">{t('adminAdminManagement.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {admins.map((admin) => (
                                <tr key={admin.id} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{admin.name}</td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{admin.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${admin.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {admin.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setEditingAdmin(admin)}
                                            className="text-brand-blue hover:text-blue-700 font-medium"
                                        >
                                            {t('adminAdminManagement.editPermissions')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {admins.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        {t('adminAdminManagement.noAdmins')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {editingAdmin && (
            <AdminPermissionsEditor
                admin={editingAdmin}
                onSave={handleSavePermissions}
                onCancel={() => setEditingAdmin(null)}
            />
        )}
        </>
    );
};
