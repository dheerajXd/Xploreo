import ImageUploader from '@/components/common/ImageUploader.jsx';

// Experience Image dropzone, now backed by the shared M3 <ImageUploader />.
export default function ImageDropzone({ id, value, onChange }) {
  return (
    <div className="field-group field-group-full">
      <ImageUploader
        id={id}
        label="Experience Image"
        value={value}
        onChange={onChange}
        helperText="SVG, PNG, JPG or GIF (max. 5MB)"
      />
    </div>
  );
}
