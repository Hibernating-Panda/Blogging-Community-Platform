export default function Categories({ name }: { name: string }) {
  return (
    <span className="bg-gray-100 text-sm px-2 py-1 rounded">
      {name}
    </span>
  );
}
