// Utility functions for handling HTML content in questions and explanations

/**
 * Strips HTML tags and returns plain text
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

/**
 * Converts HTML to a more readable format while preserving some formatting
 */
export const formatHtmlForDisplay = (html: string): string => {
  if (!html) return '';
  
  let formatted = html
    // Convert <p> tags to line breaks
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    // Convert <br> tags to line breaks
    .replace(/<br[^>]*>/gi, '\n')
    // Convert <strong> and <b> tags to **bold**
    .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
    // Convert <em> and <i> tags to *italic*
    .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
    // Convert <ul> and <ol> to simple lists
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up multiple line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
    
  return formatted;
};

/**
 * Safely renders HTML content with basic formatting
 */
export const renderSafeHtml = (html: string): { __html: string } => {
  if (!html) return { __html: '' };
  
  // Allow only safe HTML tags and remove potentially dangerous ones
  const safeHtml = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
    
  return { __html: safeHtml };
};

/**
 * Checks if content contains HTML tags
 */
export const containsHtml = (content: string): boolean => {
  return /<[^>]*>/.test(content);
};

/**
 * Formats time in MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Gets the start of the week for a given date (Sunday as start)
 */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

/**
 * Checks if two dates are in the same week
 */
export const isInSameWeek = (date1: Date, date2: Date): boolean => {
  const week1Start = getWeekStart(date1);
  const week2Start = getWeekStart(date2);
  return week1Start.getTime() === week2Start.getTime();
};

/**
 * Checks if a date is in the current week
 */
export const isInCurrentWeek = (date: Date): boolean => {
  return isInSameWeek(date, new Date());
};

/**
 * Gets the week number for a date
 */
export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};