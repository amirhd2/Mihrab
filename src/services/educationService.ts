import { db } from '../db/database';
import { EducationContentRecord, EducationTagRecord } from '../types/db';

export class EducationService {
  /**
   * Fetches all education & rulings contents sorted by newest first
   */
  static async getAllContents(): Promise<EducationContentRecord[]> {
    const contents = await db.educationContents.toArray();
    return contents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Gets a single content by ID
   */
  static async getContentById(id: number): Promise<EducationContentRecord | undefined> {
    return db.educationContents.get(id);
  }

  /**
   * Creates a new content item
   */
  static async addContent(data: {
    title: string;
    text: string;
    tags: string[];
    source?: string;
  }): Promise<number> {
    const now = new Date().toISOString();
    const newRecord: EducationContentRecord = {
      title: data.title.trim(),
      text: data.text.trim(),
      tags: data.tags.map(t => t.trim()).filter(Boolean),
      source: data.source ? data.source.trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Ensure tags exist in tags table
    for (const tag of newRecord.tags) {
      const existing = await db.educationTags.where('name').equals(tag).first();
      if (!existing) {
        await db.educationTags.add({ name: tag, createdAt: now });
      }
    }

    return db.educationContents.add(newRecord);
  }

  /**
   * Updates an existing content item
   */
  static async updateContent(
    id: number,
    data: {
      title: string;
      text: string;
      tags: string[];
      source?: string;
    }
  ): Promise<void> {
    const now = new Date().toISOString();
    const cleanTags = data.tags.map(t => t.trim()).filter(Boolean);

    // Ensure newly assigned tags exist in educationTags
    for (const tag of cleanTags) {
      const existing = await db.educationTags.where('name').equals(tag).first();
      if (!existing) {
        await db.educationTags.add({ name: tag, createdAt: now });
      }
    }

    await db.educationContents.update(id, {
      title: data.title.trim(),
      text: data.text.trim(),
      tags: cleanTags,
      source: data.source ? data.source.trim() : undefined,
      updatedAt: now,
    });
  }

  /**
   * Deletes a content item by ID
   */
  static async deleteContent(id: number): Promise<void> {
    await db.educationContents.delete(id);
  }

  /**
   * Restores a deleted content item (for Undo action)
   */
  static async restoreContent(record: EducationContentRecord): Promise<number> {
    // If it has an ID, check if exists, otherwise bulkAdd or add
    const id = await db.educationContents.add({
      title: record.title,
      text: record.text,
      tags: record.tags,
      source: record.source,
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return id;
  }

  /**
   * Fetches all tags
   */
  static async getAllTags(): Promise<EducationTagRecord[]> {
    return db.educationTags.toArray();
  }

  /**
   * Adds a new tag if it doesn't already exist
   */
  static async addTag(name: string): Promise<EducationTagRecord> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('نام تگ نمی‌تواند خالی باشد');
    }

    const existing = await db.educationTags.where('name').equals(trimmed).first();
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const id = await db.educationTags.add({ name: trimmed, createdAt: now });
    return { id, name: trimmed, createdAt: now };
  }

  /**
   * Renames a tag everywhere (updates tags array in all contents)
   */
  static async renameTag(oldName: string, newName: string): Promise<void> {
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();

    if (!cleanNew) {
      throw new Error('نام جدید تگ نمی‌تواند خالی باشد');
    }

    if (cleanOld === cleanNew) return;

    await db.transaction('rw', [db.educationTags, db.educationContents], async () => {
      // 1. Check if new tag exists in tags table, or update old tag
      const existingNewTag = await db.educationTags.where('name').equals(cleanNew).first();
      const oldTagRecord = await db.educationTags.where('name').equals(cleanOld).first();

      if (oldTagRecord) {
        if (existingNewTag) {
          // Merge: remove old tag record since new tag already exists
          await db.educationTags.delete(oldTagRecord.id!);
        } else {
          // Rename old tag record
          await db.educationTags.update(oldTagRecord.id!, { name: cleanNew });
        }
      } else if (!existingNewTag) {
        await db.educationTags.add({ name: cleanNew, createdAt: new Date().toISOString() });
      }

      // 2. Update all contents that use oldName
      const contents = await db.educationContents.toArray();
      for (const content of contents) {
        if (content.tags && content.tags.includes(cleanOld)) {
          // Replace oldName with cleanNew without duplicates
          const updatedTags = Array.from(
            new Set(content.tags.map(t => (t === cleanOld ? cleanNew : t)))
          );
          await db.educationContents.update(content.id!, {
            tags: updatedTags,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });
  }

  /**
   * Deletes a tag without deleting associated contents
   */
  static async deleteTag(tagName: string): Promise<void> {
    const cleanName = tagName.trim();

    await db.transaction('rw', [db.educationTags, db.educationContents], async () => {
      // 1. Remove tag record
      const tagRecord = await db.educationTags.where('name').equals(cleanName).first();
      if (tagRecord) {
        await db.educationTags.delete(tagRecord.id!);
      }

      // 2. Remove tag relationship from all contents
      const contents = await db.educationContents.toArray();
      for (const content of contents) {
        if (content.tags && content.tags.includes(cleanName)) {
          const updatedTags = content.tags.filter(t => t !== cleanName);
          await db.educationContents.update(content.id!, {
            tags: updatedTags,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });
  }

  /**
   * Calculates the usage count of each tag across all contents
   */
  static async getTagUsageCounts(): Promise<Record<string, number>> {
    const contents = await db.educationContents.toArray();
    const counts: Record<string, number> = {};

    for (const content of contents) {
      if (Array.isArray(content.tags)) {
        for (const tag of content.tags) {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      }
    }

    return counts;
  }
}
