'use client';

import React from 'react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  moduleId: string;
}

export function VideoPlayer({
  videoId,
  title,
  moduleId
}: VideoPlayerProps) {
  // Google Drive embed URL for videos
  const getGoogleDriveEmbedUrl = (fileId: string) => {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
      {/* Video Container with Proper Aspect Ratio */}
      <div className="relative w-full aspect-video overflow-hidden bg-gray-900">
        <iframe 
          src={getGoogleDriveEmbedUrl(videoId)}
          title={title}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          id={`video-iframe-${moduleId}`}
        />
      </div>
    </div>
  );
} 