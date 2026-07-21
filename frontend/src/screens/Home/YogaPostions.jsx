import { useEffect, useState } from "react";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import downwardDog from "../../media/dd.jpg";
import treePose from "../../media/tp.jpg";
import warriorII from "../../media/w2.jpg";
import bridgePose from "../../media/bp.jpg";
import childPose from "../../media/cp.jpg";

const yogaPositions = [
	{
		id: 1,
		name: "Adho Mukha Svanasana (Downward Dog)",
		image: downwardDog,
		description:
			"Balances Vata by grounding energy, enhances circulation, and revitalizes Prana throughout the body.",
	},
	{
		id: 2,
		name: "Vrikshasana (Tree Pose)",
		image: treePose,
		description:
			"Cultivates inner stillness and focus, strengthens the core, and aligns the body's energies, harmonizing Vata and Pitta.",
	},
	{
		id: 3,
		name: "Virabhadrasana II (Warrior II)",
		image: warriorII,
		description:
			"Ignites inner fire (Agni), strengthens the lower body, and opens the chest, balancing Kapha and Pitta doshas.",
	},
	{
		id: 4,
		name: "Setu Bandhasana (Bridge Pose)",
		image: bridgePose,
		description:
			"Invokes heart-opening energy, stimulates digestion, and nourishes the nervous system, balancing Kapha and Vata.",
	},
	{
		id: 5,
		name: "Balasana (Child's Pose)",
		image: childPose,
		description:
			"Deeply calming for the mind, soothes the nervous system, and releases tension, bringing balance to Vata dosha.",
	},
];

const YogaPositions = () => {
	const [api, setApi] = useState(null);
	const [selected, setSelected] = useState(0);

	useEffect(() => {
		if (!api) return;
		const onSelect = () => setSelected(api.selectedScrollSnap());
		onSelect();
		api.on("select", onSelect);
		return () => api.off("select", onSelect);
	}, [api]);

	return (
		<div className="relative mx-auto mt-15 w-[95%] max-w-320 overflow-hidden rounded-[10px] bg-gradient-to-b from-(--jh-olive-leaf) to-white/50 px-0 py-12.5">
			<h2 className="mb-7.5 text-center text-3xl font-medium text-white sm:mb-8">Yoga Positions</h2>

			<Carousel setApi={setApi} opts={{ align: "center", loop: yogaPositions.length > 3 }} className="px-14">
				<CarouselContent>
					{yogaPositions.map((pose) => (
						<CarouselItem key={pose.id} className="basis-9/10 sm:basis-1/2 lg:basis-1/3">
							<div className="flex h-full flex-col items-start rounded-2xl bg-card p-6 text-left shadow-[0_20px_40px_-24px_rgba(20,28,12,0.5)] transition-transform duration-450 ease-out hover:-translate-y-1.5">
								<div className="mb-5.5 h-52.5 w-full overflow-hidden rounded-xl">
									<img src={pose.image} alt={pose.name} className="size-full object-cover" />
								</div>
								<h3 className="font-display m-0 mb-2.5 text-xl leading-tight font-semibold text-foreground">{pose.name}</h3>
								<p className="m-0 text-sm leading-relaxed text-muted-foreground">{pose.description}</p>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious className="border-none bg-(--jh-olive-leaf) text-white shadow-[0_6px_26px_6px_rgba(47,53,36,0.25)] hover:bg-(--jh-olive-deep) hover:text-white" />
				<CarouselNext className="border-none bg-(--jh-olive-leaf) text-white shadow-[0_6px_26px_6px_rgba(47,53,36,0.25)] hover:bg-(--jh-olive-deep) hover:text-white" />
			</Carousel>

			<div className="mt-6 flex justify-center gap-2">
				{yogaPositions.map((pose, i) => (
					<button
						key={pose.id}
						type="button"
						aria-label={`Go to slide ${i + 1}`}
						onClick={() => api?.scrollTo(i)}
						className={`h-2.5 rounded-full bg-white transition-[width,opacity] duration-500 ${i === selected ? "w-25 opacity-100" : "w-3.25 opacity-40"}`}
					/>
				))}
			</div>
		</div>
	);
};

export default YogaPositions;
