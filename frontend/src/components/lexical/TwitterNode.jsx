import { useEffect, useRef } from "react";
import { DecoratorNode } from "lexical";

import { renderTwitterEmbeds } from "@/lib/twitterWidgets";
import ResizableEmbed from "@/components/lexical/ResizableEmbed";

function TwitterComponent({ nodeKey, tweetUrl, width }) {
	const ref = useRef(null);

	useEffect(() => {
		if (ref.current) renderTwitterEmbeds(ref.current);
	}, [tweetUrl, width]);

	return (
		<ResizableEmbed nodeKey={nodeKey} width={width} className="my-4 mx-auto flex justify-center">
			<div ref={ref}>
				<blockquote className="twitter-tweet" data-width={width || undefined}>
					<a href={tweetUrl}>{tweetUrl}</a>
				</blockquote>
			</div>
		</ResizableEmbed>
	);
}

export class TwitterNode extends DecoratorNode {
	__tweetUrl;
	__width;

	static getType() {
		return "twitter";
	}

	static clone(node) {
		return new TwitterNode(node.__tweetUrl, node.__width, node.__key);
	}

	constructor(tweetUrl, width, key) {
		super(key);
		this.__tweetUrl = tweetUrl;
		this.__width = width || null;
	}

	setWidth(width) {
		const writable = this.getWritable();
		writable.__width = width;
	}

	createDOM() {
		return document.createElement("div");
	}

	updateDOM() {
		return false;
	}

	static importJSON(serializedNode) {
		return $createTwitterNode(serializedNode.tweetUrl, serializedNode.width);
	}

	exportJSON() {
		return {
			type: "twitter",
			version: 1,
			tweetUrl: this.__tweetUrl,
			width: this.__width,
		};
	}

	static importDOM() {
		return {
			blockquote: (domNode) => {
				if (!domNode.classList.contains("twitter-tweet")) return null;
				return {
					conversion: () => {
						const link = domNode.querySelector("a");
						const url = link?.getAttribute("href");
						if (!url) return null;
						const width = parseInt(domNode.getAttribute("data-width"), 10);
						return { node: $createTwitterNode(url, Number.isFinite(width) ? width : null) };
					},
					priority: 1,
				};
			},
		};
	}

	exportDOM() {
		const blockquote = document.createElement("blockquote");
		blockquote.setAttribute("class", "twitter-tweet");
		if (this.__width) blockquote.setAttribute("data-width", String(this.__width));
		const link = document.createElement("a");
		link.setAttribute("href", this.__tweetUrl);
		link.textContent = this.__tweetUrl;
		blockquote.appendChild(link);
		return { element: blockquote };
	}

	decorate() {
		return <TwitterComponent nodeKey={this.getKey()} tweetUrl={this.__tweetUrl} width={this.__width} />;
	}

	isInline() {
		return false;
	}
}

export function $createTwitterNode(tweetUrl, width) {
	return new TwitterNode(tweetUrl, width);
}

export function $isTwitterNode(node) {
	return node instanceof TwitterNode;
}
