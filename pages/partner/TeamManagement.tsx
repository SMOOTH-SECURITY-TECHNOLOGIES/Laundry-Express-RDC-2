import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, UserRole, TeamMemberRole } from '../../types';
import { Icon } from '../../components/Icon';

const initialFormState: { name: string; email: string; role: 'partner-manager' | 'partner-staff' } = { 
    name: '', email: '', role: 'partner-staff' 
};

export const TeamManagement: React.FC = () => {
    const { user, getAllUsers, addNotification, t } = useAppContext();
    // In a real app, these would be API calls. We simulate them here.
    const { addTeamMember: apiAddTeamMember, apiUpdateTeamMemberRole, apiRemoveTeamMember } = useAppContext(); 

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [formData, setFormData] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const teamMembers = useMemo(() => {
        if (!user?.partnerId) return [];
        return getAllUsers().filter(u => u.partnerId === user.partnerId)
            .sort((a, b) => a.role === 'partner-owner' ? -1 : b.role === 'partner-owner' ? 1 : 0);
    }, [getAllUsers, user]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = t('validation.required');
        if (!formData.email.trim()) {
            newErrors.email = t('validation.required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('validation.invalidEmail');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate() || !user?.partnerId) return;

        setIsLoading(true);
        try {
            // The backend simulation will convert this back to the enum
            const roleToSend = formData.role;
            await apiAddTeamMember(user.partnerId, { ...formData, role: roleToSend });
            addNotification(t('teamManagement.inviteSuccess'), 'success');
            setFormData(initialFormState);
            setIsFormVisible(false);
        } catch (err: any) {
            const errorKey = err.message === 'Email already exists' ? 'teamManagement.inviteErrorExists' : 'teamManagement.inviteError';
            addNotification(t(errorKey), 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            // FIX: The backend simulation was updated to use enums, but the frontend was sending strings. The frontend has been corrected to send the appropriate enum values for 'role' when adding or updating a team member.
            const roleToSend = newRole as TeamMemberRole;
            await apiUpdateTeamMemberRole(userId, roleToSend);
            addNotification(t('teamManagement.updateSuccess'), 'success');
        } catch (err) {
            addNotification(t('teamManagement.updateError'), 'error');
        }
    };

    const handleRemove = async (userId: string, userName: string) => {
        if (window.confirm(t('teamManagement.confirmRemove', { name: userName }))) {
            try {
                await apiRemoveTeamMember(userId);
                addNotification(t('teamManagement.removeSuccess'), 'success');
            } catch(err) {
                addNotification(t('teamManagement.removeError'), 'error');
            }
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold dark:text-slate-100">{t('teamManagement.title')}</h1>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold dark:text-slate-100">{t('teamManagement.teamMembers')} ({teamMembers.length})</h2>
                    {!isFormVisible && (
                        <button onClick={() => setIsFormVisible(true)} className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg flex items-center space-x-2">
                            <Icon name="user" className="w-5 h-5"/>
                            <span>{t('teamManagement.inviteMember')}</span>
                        </button>
                    )}
                </div>

                {isFormVisible && (
                    <form onSubmit={handleInvite} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700 space-y-4 mb-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('teamManagement.memberName')}</label>
                                <input type="text" name="name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} onBlur={validate} required className={`mt-1 w-full p-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                             <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('teamManagement.memberEmail')}</label>
                                <input type="email" name="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} onBlur={validate} required className={`mt-1 w-full p-2 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                                 {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                        </div>
                         <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('teamManagement.memberRole')}</label>
                            <select name="role" value={formData.role} onChange={e => setFormData(p => ({...p, role: e.target.value as any}))} className="mt-1 w-full p-2 border border-gray-300 rounded-lg bg-white">
                                <option value="partner-staff">{t('roles.partner-staff')}</option>
                                <option value="partner-manager">{t('roles.partner-manager')}</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button type="button" onClick={() => setIsFormVisible(false)} className="px-4 py-2 text-sm bg-slate-200 rounded-lg">{t('buttons.cancel')}</button>
                            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm text-white bg-brand-success rounded-lg">{isLoading ? t('buttons.loading') : t('teamManagement.sendInvite')}</button>
                        </div>
                    </form>
                )}
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-slate-500 dark:text-slate-400">
                           <tr className="border-b dark:border-slate-700">
                               <th className="py-2 px-4">{t('teamManagement.table.name')}</th>
                               <th className="py-2 px-4">{t('teamManagement.table.email')}</th>
                               <th className="py-2 px-4">{t('teamManagement.table.role')}</th>
                               <th className="py-2 px-4">{t('teamManagement.table.actions')}</th>
                           </tr>
                        </thead>
                        <tbody>
                            {teamMembers.map(member => (
                                <tr key={member.id} className="border-b dark:border-slate-700 last:border-0">
                                    <td className="py-3 px-4 font-medium dark:text-slate-100">{member.name}</td>
                                    <td className="py-3 px-4">{member.email}</td>
                                    <td className="py-3 px-4">
                                        {member.role === 'partner-owner' ? (
                                            <span className="font-semibold text-brand-blue">{t('roles.partner-owner')}</span>
                                        ) : (
                                            <select 
                                                value={member.role} 
                                                onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                                                className="p-1 border rounded bg-white text-xs"
                                            >
                                                <option value="partner-staff">{t('roles.partner-staff')}</option>
                                                <option value="partner-manager">{t('roles.partner-manager')}</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        {member.role !== 'partner-owner' && (
                                            <button onClick={() => handleRemove(member.id, member.name)} className="p-2 text-red-600 hover:bg-red-100 rounded-full">
                                                <Icon name="xmark" className="w-5 h-5"/>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};