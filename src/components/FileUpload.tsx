import { useRef } from 'react';

type FileUploadProps = {
  onFileContent: (content: string, filename: string) => void;
};

const SHADER_EXTS = ['.frag', '.vert', '.glsl', '.comp', '.geom', '.tesc', '.tese'];

export default function FileUpload({ onFileContent }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SHADER_EXTS.includes(ext)) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onFileContent(reader.result as string, file.name);
    };
    reader.readAsText(file);

    // Reset so re-selecting the same file triggers onChange
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <span className="file-upload">
      <label className="file-upload-label" htmlFor="shader-file-input">
        Upload
      </label>
      <input
        id="shader-file-input"
        ref={inputRef}
        type="file"
        accept=".frag,.vert,.glsl,.comp,.geom,.tesc,.tese"
        onChange={handleChange}
      />
    </span>
  );
}
