export interface DayPickerProps {
  value: string;
  onChange: (date: string) => void;
}

export default function DayPicker({ value, onChange }: DayPickerProps) {
  return (
    <label className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700">
      Día a consultar
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-gray-900"
      />
    </label>
  );
}
