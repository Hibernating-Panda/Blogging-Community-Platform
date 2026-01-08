import Link from "next/link";
import Tag from "./Tag";

type Props = {
  id: string;
  title: string;
  desc: string;
  votes: number;
  answers: number;
  views: number;
  tags: string[];
  author: string;
  time: string;
};

export default function QuestionItem({
  id,
  title,
  desc,
  votes,
  answers,
  views,
  tags,
  author,
  time,
}: Props) {
  return (
    <div className="flex gap-6 border-b pb-6">
      <div className="text-center text-sm text-gray-500 w-20">
        <div>{votes} votes</div>
        <div>{answers} answers</div>
        <div>{views} views</div>
      </div>

      <div className="flex-1">
        <Link
          href={`/forum/${id}`}
          className="text-blue-600 font-medium hover:underline"
        >
          {title}
        </Link>

        <p className="text-gray-600 mt-1">{desc}</p>

        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag) => (
              <Tag key={tag} name={tag} />
            ))}
          </div>

          <span className="text-sm text-gray-500">
            {author} · {time}
          </span>
        </div>
      </div>
    </div>
  );
}
