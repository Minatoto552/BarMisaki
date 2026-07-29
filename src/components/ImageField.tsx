import { Camera, ImagePlus } from 'lucide-react';
import { useEffect, useId, useMemo } from 'react';

export const ImageField = ({ file, onChange, label = '画像を選択' }: {
  file: File | null; onChange: (file: File | null) => void; label?: string;
}) => {
  const id = useId();
  const preview = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  return (
    <div className="image-field">
      <label className={`image-drop ${preview ? 'has-image' : ''}`} htmlFor={id}>
        {preview ? <img src={preview} alt="選択した画像のプレビュー" /> : <><ImagePlus size={32} /><strong>{label}</strong><span>写真またはファイルから選択・5MBまで</span></>}
      </label>
      <input id={id} type="file" accept="image/*"
        onChange={(event) => onChange(event.target.files?.[0] || null)} />
      {preview && <label className="text-button" htmlFor={id}><Camera size={17} />画像を変更</label>}
    </div>
  );
};
