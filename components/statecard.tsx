import Image from "next/image";

interface StatCardProps {
  title: string;
  image: string;
  value: string | number;
  change: string;
  note: string;
}

export default function StatCard({
  title,
  image,
  value,
  change,
  note,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between min-h-60">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xl text-gray-500">{title}</p>
        {/* Image */}
        <div className="relative w-12 h-12 mt-2">
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Value */}
      <h3 className="text-3xl font-bold">{value}</h3>

      {/* Footer */}
      <div className="flex justify-between">
        <p className="text-xs text-green-500">↗ {change}</p>
        <p className="text-xs text-gray-400">{note}</p>
      </div>
    </div>
  );
}