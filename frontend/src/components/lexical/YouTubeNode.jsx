import { DecoratorNode } from "lexical";

import ResizableEmbed from "@/components/lexical/ResizableEmbed";

function YouTubeComponent({ nodeKey, videoId, width }) {
	return (
		<ResizableEmbed nodeKey={nodeKey} width={width} className="my-4">
			<div className="iframe-container">
				<iframe
					src={`https://www.youtube-nocookie.com/embed/${videoId}`}
					title="Embedded YouTube video"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					frameBorder="0"
				/>
			</div>
		</ResizableEmbed>
	);
}

export class YouTubeNode extends DecoratorNode {
	__videoId;
	// Pixel width set by dragging the resize handle; height follows via the
	// 16:9 aspect-ratio on .iframe-container, so only width needs persisting.
	__width;

	static getType() {
		return "youtube";
	}

	static clone(node) {
		return new YouTubeNode(node.__videoId, node.__width, node.__key);
	}

	constructor(videoId, width, key) {
		super(key);
		this.__videoId = videoId;
		this.__width = width || null;
	}

	getSrc() {
		return `https://www.youtube-nocookie.com/embed/${this.__videoId}`;
	}

	setWidth(width) {
		const writable = this.getWritable();
		writable.__width = width;
	}

	createDOM() {
		const div = document.createElement("div");
		return div;
	}

	updateDOM() {
		return false;
	}

	static importJSON(serializedNode) {
		return $createYouTubeNode(serializedNode.videoId, serializedNode.width);
	}

	exportJSON() {
		return {
			type: "youtube",
			version: 1,
			videoId: this.__videoId,
			width: this.__width,
		};
	}

	static importDOM() {
		return {
			iframe: (domNode) => {
				const src = domNode.getAttribute("src") || "";
				if (!/youtube(-nocookie)?\.com\/embed\//.test(src)) return null;
				return {
					conversion: (node) => {
						const match = src.match(/embed\/([a-zA-Z0-9_-]{11})/);
						if (!match) return null;
						const styleWidth = parseInt(node.parentElement?.style.width, 10);
						return { node: $createYouTubeNode(match[1], Number.isFinite(styleWidth) ? styleWidth : null) };
					},
					priority: 1,
				};
			},
		};
	}

	exportDOM() {
		const container = document.createElement("div");
		container.setAttribute("class", "iframe-container");
		if (this.__width) container.setAttribute("style", `width:${this.__width}px;max-width:100%;`);
		const iframe = document.createElement("iframe");
		iframe.setAttribute("src", this.getSrc());
		iframe.setAttribute("allowfullscreen", "true");
		iframe.setAttribute("frameborder", "0");
		container.appendChild(iframe);
		return { element: container };
	}

	decorate() {
		return <YouTubeComponent nodeKey={this.getKey()} videoId={this.__videoId} width={this.__width} />;
	}

	isInline() {
		return false;
	}
}

export function $createYouTubeNode(videoId, width) {
	return new YouTubeNode(videoId, width);
}

export function $isYouTubeNode(node) {
	return node instanceof YouTubeNode;
}
