'use client';

import { Note } from '@prisma/client';
import { Calendar, User } from 'lucide-react';

interface NotesListProps {
  notes: Note[];
}

export default function NotesList({ notes }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No notes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span className="font-medium">{note.authorName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{new Date(note.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
        </div>
      ))}
    </div>
  );
}
