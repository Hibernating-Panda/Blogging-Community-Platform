import Link from "next/link";
import Tag from "./Tag";
import { PRESET_CATEGORIES } from "@/types/firestore";

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

export default function QuestionItem(props: Props) {
  return (
    <div className="flex gap-6 border-b pb-6">
      <div className="text-center text-sm text-gray-500 w-20">
        <div>{props.votes} votes</div>
        <div>{props.answers} answers</div>
        <div>{props.views} views</div>
      </div>

      <div className="flex-1">
        <Link
          href={`/forum/${props.id}`}
          className="text-blue-600 font-medium hover:underline"
        >
          {props.title}
        </Link>

        <p className="text-gray-600 mt-1">{props.desc}</p>

        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2 flex-wrap">
            {props.tags.map((tagId) => {
              const cat = PRESET_CATEGORIES.find(
                (c) => c.id === tagId
              );
              return cat ? (
                <Tag key={tagId} name={cat.name} />
              ) : null;
            })}
          </div>

          <span className="text-sm text-gray-500">
            {props.author} · {props.time}
          </span>
        </div>
      </div>
    </div>
  );
}
