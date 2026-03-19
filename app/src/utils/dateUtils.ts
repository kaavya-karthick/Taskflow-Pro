/**
 * Date Utility Functions
 */

/**
 * Format a date to a readable string
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'Not set';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a date with time
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'Not set';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export const formatDistanceToNow = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

/**
 * Check if a date is overdue
 */
export const isOverdue = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  return d < now;
};

/**
 * Check if a date is today
 */
export const isToday = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is tomorrow
 */
export const isTomorrow = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return (
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear()
  );
};

/**
 * Format due date with relative indicator
 */
export const formatDueDate = (date: string | Date | null | undefined): { text: string; isOverdue: boolean; isToday: boolean; isTomorrow: boolean } => {
  if (!date) {
    return { text: 'No due date', isOverdue: false, isToday: false, isTomorrow: false };
  }
  
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return { text: 'Invalid date', isOverdue: false, isToday: false, isTomorrow: false };
  }
  
  const overdue = isOverdue(date);
  const today = isToday(date);
  const tomorrow = isTomorrow(date);
  
  let text = formatDate(date);
  
  if (today) {
    text = 'Today';
  } else if (tomorrow) {
    text = 'Tomorrow';
  }
  
  return { text, isOverdue: overdue, isToday: today, isTomorrow: tomorrow };
};

/**
 * Get days in month
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Get first day of month (0 = Sunday, 1 = Monday, etc.)
 */
export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

/**
 * Get calendar weeks for a month
 */
export const getCalendarWeeks = (year: number, month: number): (number | null)[][] => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];
  
  // Fill in empty days at the start
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }
  
  // Fill in the days
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  // Fill in empty days at the end
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
};

/**
 * Format time only
 */
export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
