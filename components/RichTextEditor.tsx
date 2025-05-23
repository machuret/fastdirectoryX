import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React from 'react';

interface RichTextEditorProps {
  initialContent?: string;
  onChange: (html: string) => void;
  onBlur?: () => void; // Optional: for form validation triggers
}

const MenuBar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  // Basic styling for buttons - can be improved with CSS classes
  const buttonStyle = {
    margin: '0 5px 5px 0',
    padding: '5px 10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#eee',
    borderColor: '#aaa',
  };

  return (
    <div style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px' }}>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        style={editor.isActive('bold') ? activeButtonStyle : buttonStyle}
      >
        Bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        style={editor.isActive('italic') ? activeButtonStyle : buttonStyle}
      >
        Italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        style={editor.isActive('strike') ? activeButtonStyle : buttonStyle}
      >
        Strike
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        style={editor.isActive('heading', { level: 1 }) ? activeButtonStyle : buttonStyle}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        style={editor.isActive('heading', { level: 2 }) ? activeButtonStyle : buttonStyle}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        style={editor.isActive('heading', { level: 3 }) ? activeButtonStyle : buttonStyle}
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={editor.isActive('bulletList') ? activeButtonStyle : buttonStyle}
      >
        Bullet List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={editor.isActive('orderedList') ? activeButtonStyle : buttonStyle}
      >
        Ordered List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        style={buttonStyle}
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        style={buttonStyle}
      >
        Redo
      </button>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent = '', onChange, onBlur }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure StarterKit options if needed, e.g., disable certain features
        // heading: { levels: [1, 2, 3] },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onBlur: () => {
      if (onBlur) {
        onBlur();
      }
    }
  });

  React.useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
        // This ensures that if initialContent changes externally (e.g., form reset or different data loaded),
        // the editor updates. Be cautious if the user is actively typing and initialContent changes frequently.
        editor.commands.setContent(initialContent, false); // false to not emit an update event here
    }
  }, [initialContent, editor]);

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
