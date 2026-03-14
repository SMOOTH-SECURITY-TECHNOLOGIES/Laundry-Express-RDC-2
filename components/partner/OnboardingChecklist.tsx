import React, { useMemo, useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../Icon';
import { Partner, DayWorkingHours, WorkingHours } from '../../types';

interface OnboardingChecklistProps {
  partner: Partner;
  onNavigate: (section: 'profile' | 'promotions') => void;
}

interface Task {
  key: string;
  title: string;
  description: string;
  isComplete: boolean;
  action: () => void;
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: string;
}

// Helper functions
const hasValidWorkingHours = (workingHours?: WorkingHours): boolean => {
  if (!workingHours) return false;
  
  return Object.values(workingHours).some((day: DayWorkingHours) => {
    if (day.isClosed) return false;
    
    // Check if time range is valid (open before close)
    const [openHour, openMinute] = day.open.split(':').map(Number);
    const [closeHour, closeMinute] = day.close.split(':').map(Number);
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
    return openTime < closeTime;
  });
};

const getTaskPriority = (key: string, isComplete: boolean): Task['priority'] => {
  if (isComplete) return 'low';
  
  const priorityMap: Record<string, 'high' | 'medium' | 'low'> = {
    setHours: 'high',
    addService: 'high',
    addVideo: 'medium',
    createPromo: 'medium',
  };
  
  return priorityMap[key] || 'medium';
};

const getEstimatedTime = (key: string): string => {
  const timeMap: Record<string, string> = {
    setHours: '5 min',
    addService: '10 min',
    addVideo: '2 min',
    createPromo: '3 min',
  };
  
  return timeMap[key] || '5 min';
};

const getPriorityColor = (priority: Task['priority']): string => {
  const colors = {
    high: 'text-red-500 dark:text-red-400',
    medium: 'text-amber-500 dark:text-amber-400',
    low: 'text-slate-400 dark:text-slate-500',
  };
  
  return colors[priority];
};

const getPriorityBorder = (priority: Task['priority']): string => {
  const borders = {
    high: 'border-l-red-400 dark:border-l-red-500',
    medium: 'border-l-amber-400 dark:border-l-amber-500',
    low: 'border-l-slate-300 dark:border-l-slate-600',
  };
  
  return borders[priority];
};

// Task Item Component
interface TaskItemProps {
  task: Task;
  onAction: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onAction }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleAction = useCallback(() => {
    onAction();
  }, [onAction]);

  return (
    <div
      className={`
        p-4 rounded-lg border-l-4 transition-all duration-300 flex items-start
        ${task.isComplete 
          ? 'bg-green-50 dark:bg-green-900/20 border-l-green-400 dark:border-l-green-500' 
          : `bg-white dark:bg-slate-800/50 ${getPriorityBorder(task.priority)} hover:shadow-md hover:scale-[1.02]`
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      <div className="flex items-start mr-3 mt-0.5">
        <div 
          className={`
            w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300
            ${task.isComplete 
              ? 'bg-brand-success shadow-sm' 
              : 'border-2 border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700'
            }
          `}
        >
          <Icon 
            name="check" 
            className={`
              w-3 h-3 transition-all duration-300
              ${task.isComplete 
                ? 'text-white scale-100' 
                : 'text-transparent scale-0'
              }
            `} 
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-grow min-w-0">
            <h3 
              className={`
                font-semibold text-sm transition-colors duration-300
                ${task.isComplete 
                  ? 'text-slate-500 dark:text-slate-400 line-through' 
                  : 'text-slate-800 dark:text-slate-100'
                }
              `}
            >
              {task.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {task.description}
            </p>
          </div>
          
          {/* Priority and Time */}
          {!task.isComplete && (
            <div className="flex items-center space-x-2 ml-2 shrink-0">
              {task.estimatedTime && (
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                  {task.estimatedTime}
                </span>
              )}
              <div 
                className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}
                title={`${task.priority} priority`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      {!task.isComplete && (
        <button
          onClick={handleAction}
          className={`
            px-3 py-1 text-xs font-semibold rounded-full shadow-sm transition-all duration-300
            ml-3 shrink-0 border
            ${isHovered
              ? 'bg-brand-blue text-white border-brand-blue transform scale-105'
              : 'bg-white dark:bg-slate-800 text-brand-blue border-slate-300 dark:border-slate-600'
            }
          `}
          aria-label={`Complete ${task.title}`}
        >
          Go
        </button>
      )}
    </div>
  );
};

// Progress Circle Component
interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ 
  progress, 
  size = 60, 
  strokeWidth = 4 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-brand-success transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ 
  partner, 
  onNavigate 
}) => {
  const { t, promoCodes } = useAppContext();
  const [isVisible, setIsVisible] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Memoized tasks calculation
  const tasks: Task[] = useMemo(() => {
    const hasHours = hasValidWorkingHours(partner.workingHours);
    const hasServices = (partner.serviceIds || []).length > 0;
    const hasVideo = !!partner.videoUrl;
    const hasPromo = promoCodes.some(p => p.partnerId === partner.id);

    const taskDefinitions = [
      {
        key: 'setHours',
        title: t('onboarding.steps.setHours.title'),
        description: t('onboarding.steps.setHours.description'),
        isComplete: hasHours,
        action: () => onNavigate('profile'),
      },
      {
        key: 'addService',
        title: t('onboarding.steps.addService.title'),
        description: t('onboarding.steps.addService.description'),
        isComplete: hasServices,
        action: () => onNavigate('profile'),
      },
      {
        key: 'addVideo',
        title: t('onboarding.steps.addVideo.title'),
        description: t('onboarding.steps.addVideo.description'),
        isComplete: hasVideo,
        action: () => onNavigate('profile'),
      },
      {
        key: 'createPromo',
        title: t('onboarding.steps.createPromo.title'),
        description: t('onboarding.steps.createPromo.description'),
        isComplete: hasPromo,
        action: () => onNavigate('promotions'),
      },
    ];

    return taskDefinitions.map(task => ({
      ...task,
      priority: getTaskPriority(task.key, task.isComplete),
      estimatedTime: getEstimatedTime(task.key),
    }));
  }, [partner, promoCodes, t, onNavigate]);

  // Progress calculation
  const { completedCount, totalCount, progress } = useMemo(() => {
    const completedCount = tasks.filter(task => task.isComplete).length;
    const totalCount = tasks.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    return { completedCount, totalCount, progress };
  }, [tasks]);

  const allTasksComplete = completedCount === totalCount;
  const incompleteTasks = tasks.filter(task => !task.isComplete);
  const hasHighPriorityTasks = incompleteTasks.some(task => task.priority === 'high');

  // Handlers
  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleTaskAction = useCallback((action: () => void) => {
    action();
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:border dark:border-slate-700 animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-grow">
            <ProgressCircle progress={progress} />
            <div className="flex-grow min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold dark:text-slate-100">
                  {t('onboarding.title')}
                </h2>
                {hasHighPriorityTasks && (
                  <span 
                    className="px-2 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full"
                    title="High priority tasks pending"
                  >
                    {t('onboarding.priority')}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('onboarding.subtitle')}
              </p>
              
              {/* Progress Info */}
              <div className="flex items-center space-x-4 mt-3">
                <span className="text-sm font-semibold text-brand-blue">
                  {t('onboarding.progress', { completed: completedCount, total: totalCount })}
                </span>
                {allTasksComplete ? (
                  <span className="text-sm font-semibold text-brand-success flex items-center">
                    <Icon name="check" className="w-4 h-4 mr-1" />
                    {t('onboarding.complete')}
                  </span>
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {incompleteTasks.length} {t('onboarding.tasksRemaining')}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button 
              onClick={handleToggleCollapse}
              className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors duration-200"
              aria-label={isCollapsed ? 'Expand checklist' : 'Collapse checklist'}
            >
              <Icon 
                name={isCollapsed ? 'chevron-down' : 'chevron-up'} 
                className="w-5 h-5" 
              />
            </button>
            <button 
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors duration-200"
              aria-label="Close checklist"
            >
              <Icon name="xmark" className="w-5 h-5"/>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-6">
          {allTasksComplete ? (
            // Completion State
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-brand-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="check" className="w-8 h-8 text-brand-success"/>
              </div>
              <h3 className="font-semibold text-lg dark:text-slate-100 mb-2">
                {t('onboarding.allDone')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {t('onboarding.allDoneDescription')}
              </p>
            </div>
          ) : (
            // Tasks List
            <div className="space-y-3">
              {tasks.map(task => (
                <TaskItem
                  key={task.key}
                  task={task}
                  onAction={() => handleTaskAction(task.action)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Collapsed State */}
      {isCollapsed && (
        <div className="p-4 text-center border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleToggleCollapse}
            className="text-sm text-brand-blue hover:text-brand-blue/80 font-semibold flex items-center justify-center w-full"
          >
            <Icon name="chevron-down" className="w-4 h-4 mr-1" />
            {t('onboarding.showChecklist')}
          </button>
        </div>
      )}
    </div>
  );
};