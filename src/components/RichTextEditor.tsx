import { useMemo } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import {
  Alignment,
  Bold,
  ClassicEditor,
  Essentials,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  Heading,
  Italic,
  Link,
  List,
  Paragraph,
  Underline,
  Undo,
} from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const config = useMemo(
    () => ({
      licenseKey: 'GPL' as const,
      plugins: [
        Essentials,
        Paragraph,
        Heading,
        Bold,
        Italic,
        Underline,
        Link,
        List,
        Alignment,
        FontFamily,
        FontSize,
        FontColor,
        FontBackgroundColor,
        Undo,
      ],
      toolbar: [
        'undo',
        'redo',
        '|',
        'heading',
        '|',
        'fontFamily',
        'fontSize',
        'fontColor',
        'fontBackgroundColor',
        '|',
        'bold',
        'italic',
        'underline',
        '|',
        'alignment',
        '|',
        'bulletedList',
        'numberedList',
        '|',
        'link',
      ],
      fontSize: {
        options: [12, 14, 16, 18, 20, 24, 28, 32],
        supportAllValues: false,
      },
      fontFamily: {
        options: [
          'default',
          'Georgia, serif',
          "'Times New Roman', Times, serif",
          'Arial, Helvetica, sans-serif',
          "'Courier New', Courier, monospace",
          'cursive',
        ],
      },
      alignment: {
        options: ['left', 'center', 'right', 'justify'] as Array<
          'left' | 'center' | 'right' | 'justify'
        >,
      },
      placeholder: placeholder ?? 'Tulis quotes atau ayat pembuka…',
    }),
    [placeholder],
  )

  return (
    <div className="rich-text-editor mt-1 overflow-hidden rounded-lg border border-stone-200 bg-white">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={config}
        onChange={(_event, editor) => {
          onChange(editor.getData())
        }}
      />
    </div>
  )
}
