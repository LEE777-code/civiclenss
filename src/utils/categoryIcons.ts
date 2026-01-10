import {
    Construction,
    Trash2,
    Droplet,
    Lightbulb,
    ShieldAlert,
    Building2,
    Trees,
    HelpCircle,
    LucideIcon
} from "lucide-react";

/**
 * Maps report categories to their corresponding Lucide icons
 */
export const getCategoryIcon = (category: string): LucideIcon => {
    const categoryMap: Record<string, LucideIcon> = {
        "Road Issues": Construction,
        "Garbage & Cleanliness": Trash2,
        "Water / Drainage": Droplet,
        "Streetlight / Electricity": Lightbulb,
        "Public Safety": ShieldAlert,
        "Public Facilities": Building2,
        "Parks & Environment": Trees,
        "Other": HelpCircle,
    };

    return categoryMap[category] || HelpCircle;
};

/**
 * Returns the category name in a consistent format
 */
export const formatCategory = (category: string): string => {
    // Handle variations in category naming
    const categoryFormatMap: Record<string, string> = {
        "garbage & cleanliness": "Garbage & Cleanliness",
        "water / drainage": "Water / Drainage",
        "water": "Water / Drainage",
        "drainage": "Water / Drainage",
        "streetlight / electricity": "Streetlight / Electricity",
        "streetlight": "Streetlight / Electricity",
        "electricity": "Streetlight / Electricity",
        "public safety": "Public Safety",
        "public facilities": "Public Facilities",
        "parks & environment": "Parks & Environment",
        "parks": "Parks & Environment",
        "environment": "Parks & Environment",
        "road issues": "Road Issues",
        "other": "Other",
    };

    const lowerCategory = category.toLowerCase().trim();
    return categoryFormatMap[lowerCategory] || category;
};
