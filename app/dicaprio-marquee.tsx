import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

const images = [
  { src: "/angry.jpg", id: "1" },
  { src: "/laughing.jpg", id: "2" },
  { src: "/funny-face.jpg", id: "3" },
  { src: "/evil.jpg", id: "4" },
  { src: "/pointing.jpg", id: "5" },
  { src: "/cheers.webp", id: "6" },
  { src: "/sus.png", id: "7" },
  { src: "/walking.png", id: "8" },
];

const firstRow = images.slice(0, images.length / 2);
const secondRow = images.slice(images.length / 2);

const ImageCard = ({ src }: { src: string }) => {
  return (
    <figure
      className={cn(
        "relative h-64 w-64 cursor-pointer overflow-hidden rounded-xl border",
        // light styles
        "border-gray-950/10 bg-gray-950/1 hover:bg-gray-950/5",
        // dark styles
        "dark:border-gray-50/10 dark:bg-gray-50/10 dark:hover:bg-gray-50/15"
      )}
    >
      <img alt="" className="h-full w-full object-cover" src={src} />
    </figure>
  );
};

export function DiCaprioMarquee() {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden">
      <Marquee className="[--duration:20s]" pauseOnHover>
        {firstRow.map((image) => (
          <ImageCard key={image.id} src={image.src} />
        ))}
      </Marquee>
      <Marquee className="[--duration:20s]" pauseOnHover reverse>
        {secondRow.map((image) => (
          <ImageCard key={image.id} src={image.src} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-background" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-background" />
    </div>
  );
}
