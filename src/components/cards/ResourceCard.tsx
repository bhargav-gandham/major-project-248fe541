import React from 'react';
import { Resource } from '@/types';
import { FileText, Video, FileSpreadsheet, Link2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface ResourceCardProps {
  resource: Resource;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const getFileIcon = () => {
    switch (resource.fileType) {
      case 'pdf': return <FileText className="w-8 h-8" />;
      case 'video': return <Video className="w-8 h-8" />;
      case 'ppt': return <FileSpreadsheet className="w-8 h-8" />;
      case 'link': return <Link2 className="w-8 h-8" />;
      default: return <FileText className="w-8 h-8" />;
    }
  };

  const getFileColor = () => {
    switch (resource.fileType) {
      case 'pdf': return 'bg-destructive/10 text-destructive';
      case 'video': return 'bg-accent/10 text-accent';
      case 'ppt': return 'bg-warning/10 text-warning';
      case 'link': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-card transition-all duration-300 hover:shadow-lg group">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${getFileColor()}`}>
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground group-hover:text-accent transition-colors">
            {resource.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {resource.description}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>{resource.subjectName}</span>
            <span>•</span>
            <span>{resource.uploadedBy}</span>
            <span>•</span>
            <span>{format(new Date(resource.uploadedAt), 'MMM dd, yyyy')}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0">
          <Download className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default ResourceCard;
