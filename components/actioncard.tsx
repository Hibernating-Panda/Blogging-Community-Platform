interface ActionCardProps {
  value: string | number;
  image: string;
  title: string;
  description: string;
}

export default function ActionCard({
  value,
  image,
  title,
  description,
}: ActionCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between min-h-[200px]">
      <h3 className="flex items-center text-3xl font-bold">
        <div className="relative w-12 h-12 mt-2 mb-4 mr-4">
          <img src={image} alt={title} className="relative" />
        </div>
      {value}
      </h3>
      <h4 className="text-2xl font-bold text-black mb-2">{title}</h4>
      <div>
        <p className="text-lg text-gray-500">{description}</p>
      </div>
    </div>
  );
}