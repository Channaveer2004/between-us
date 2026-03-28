"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, Link as LinkIcon, Quote, Lock } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function Editor({ content, onChange }: EditorProps) {
  const [menuCoords, setMenuCoords] = useState<{ top: number, left: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-green-600 underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: 'Tell your story...',
      }),
    ],
    immediatelyRender: false,
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] text-gray-800',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  })

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      const { view, state } = editor;
      const { selection } = state;

      if (selection.empty) {
        setMenuCoords(null);
        return;
      }

      try {
        const start = view.coordsAtPos(selection.from);
        const end = view.coordsAtPos(selection.to);
        
        // Calculate center above the highlighted text
        const left = (start.left + end.left) / 2;
        const top = start.top;

        setMenuCoords({ top, left });
      } catch (e) {
        setMenuCoords(null);
      }
    };

    editor.on('selectionUpdate', updateMenu);
    editor.on('transaction', updateMenu);

    return () => {
      editor.off('selectionUpdate', updateMenu);
      editor.off('transaction', updateMenu);
    };
  }, [editor]);

  const setLink = useCallback((editorToUse: any) => {
    const previousUrl = editorToUse.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return;
    if (url === '') {
      editorToUse.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editorToUse.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [])

  if (!editor) {
    return null
  }

  return (
    <div className="w-full relative editor-container">
      
      {/* Custom Native Floating Menu built from React completely skipping BubbleMenu crashes */}
      {menuCoords && typeof window !== "undefined" && (
        <div 
          className="fixed z-99999 flex items-center bg-[#242424] text-white rounded-md shadow-2xl border border-gray-700 py-1.5 px-2 gap-1 transition-opacity duration-150"
          style={{
            top: `${menuCoords.top - 55}px`, // 55px above the text strictly within Viewport
            left: `${menuCoords.left}px`,
            transform: 'translateX(-50%)'
          }}
          onMouseDown={(e) => e.preventDefault()} // Stops focus from shifting off editor
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded hover:text-green-400 transition flex items-center justify-center ${editor.isActive('bold') ? 'text-green-400' : 'text-gray-200'}`}
          >
            <Bold size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded hover:text-green-400 transition flex items-center justify-center ${editor.isActive('italic') ? 'text-green-400' : 'text-gray-200'}`}
          >
            <Italic size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setLink(editor)}
            className={`px-2 py-1 rounded hover:text-green-400 transition flex items-center justify-center ${editor.isActive('link') ? 'text-green-400' : 'text-gray-200'}`}
          >
            <LinkIcon size={16} strokeWidth={2.5} />
          </button>
          
          <div className="w-px h-5 bg-gray-600 mx-1"></div>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 hover:text-green-400 transition flex items-center justify-center ${editor.isActive('heading', { level: 2 }) ? 'text-green-400' : 'text-gray-200'}`}
          >
            <span className="font-serif font-bold text-lg leading-none pt-0.5">T</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 hover:text-green-400 transition flex items-center justify-center ${editor.isActive('heading', { level: 3 }) ? 'text-green-400' : 'text-gray-200'}`}
          >
            <span className="font-serif font-bold text-sm leading-none pt-1">T</span>
          </button>

          <div className="w-px h-5 bg-gray-600 mx-1"></div>

          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-2 py-1 hover:text-green-400 transition flex items-center justify-center ${editor.isActive('blockquote') ? 'text-green-400' : 'text-gray-200'}`}
          >
            <Quote size={16} fill="currentColor" strokeWidth={0} />
          </button>
          
          <button
            onClick={() => alert("Private note feature coming soon!")}
            className={`px-2 py-1 text-gray-200 hover:text-green-400 transition flex items-center justify-center`}
          >
            <Lock size={15} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="border border-transparent hover:border-gray-50 transition p-2 rounded-md min-h-100">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
