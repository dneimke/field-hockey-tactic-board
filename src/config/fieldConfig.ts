import { FieldType } from '../types';

export interface FieldConfig {
  type: FieldType;
  name: string;
  imageUrl: string;
  description: string;
  coordinateMapping?: {
    isFullField: boolean;
    visibleBounds?: {
      xMin: number;
      xMax: number;
      yMin: number;
      yMax: number;
    };
  };
}

export const FIELD_CONFIGS: Record<FieldType, FieldConfig> = {
  standard: {
    type: "standard",
    name: "Standard Field",
    imageUrl: "https://storage.googleapis.com/hostinger-horizons-assets-prod/7f3aa00e-4765-4224-a301-9c51b8d05496/492a3643c0b46d7745057a94978fd3e8.webp",
    description: "Full field view for general tactics",
    coordinateMapping: {
      isFullField: true,
    }
  },
  circle_detail: {
    type: "circle_detail",
    name: "Circle Detail View",
    imageUrl: "https://storage.googleapis.com/hostinger-horizons-assets-prod/7f3aa00e-4765-4224-a301-9c51b8d05496/ab4a2763a2cfbf04dccedc8dccb6e5bb.webp",
    description: "Detailed view for penalty corners and circle tactics",
    coordinateMapping: {
      isFullField: true, // Using same coordinate system, but view emphasizes circle areas
    }
  }
};

