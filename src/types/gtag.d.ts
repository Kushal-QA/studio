
interface Window {
  gtag?: (
    command: 'config' | 'event' | 'js',
    trackingIdOrAction: string | Date,
    config?: { 
      page_path?: string; 
      event_category?: string; 
      event_label?: string; 
      value?: number;
      [key: string]: any; // Allow other GA config parameters
    }
  ) => void;
  dataLayer?: any[];
}
