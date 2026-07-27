import { DecoratorNode } from "lexical";

import ResizableEmbed from "@/components/lexical/ResizableEmbed";

function ImageComponent({ nodeKey, src, altText, width }) {
	return (
		<ResizableEmbed nodeKey={nodeKey} width={width} defaultWidth="360px" className="my-4">
			<img src={src} alt={altText} className="block w-full rounded-lg" draggable={false} />
		</ResizableEmbed>
	);
}

export class ImageNode extends DecoratorNode {
	__src;
	__altText;
	// Cloudinary public_id — only present for images uploaded through this editor
	// (toolbar button or drag/drop). Lets us delete the asset from Cloudinary
	// when the doctor removes the image from the document. Old content
	// imported from HTML that was never uploaded here has no public_id and is
	// simply left alone (we never own its lifecycle).
	__publicId;
	// Pixel width set by dragging the resize handle; null means "100% / natural".
	__width;

	static getType() {
		return "image";
	}

	static clone(node) {
		return new ImageNode(node.__src, node.__altText, node.__publicId, node.__width, node.__key);
	}

	constructor(src, altText, publicId, width, key) {
		super(key);
		this.__src = src;
		this.__altText = altText || "";
		this.__publicId = publicId || null;
		this.__width = width || null;
	}

	getPublicId() {
		return this.__publicId;
	}

	getSrc() {
		return this.__src;
	}

	setWidth(width) {
		const writable = this.getWritable();
		writable.__width = width;
	}

	createDOM() {
		return document.createElement("span");
	}

	updateDOM() {
		return false;
	}

	static importJSON(serializedNode) {
		return $createImageNode(serializedNode.src, serializedNode.altText, serializedNode.publicId, serializedNode.width);
	}

	exportJSON() {
		return {
			type: "image",
			version: 1,
			src: this.__src,
			altText: this.__altText,
			publicId: this.__publicId,
			width: this.__width,
		};
	}

	static importDOM() {
		return {
			img: () => ({
				conversion: (domNode) => {
					const styleWidth = parseInt(domNode.style.width, 10);
					return {
						node: $createImageNode(
							domNode.getAttribute("src"),
							domNode.getAttribute("alt") || "",
							domNode.getAttribute("data-cloudinary-id"),
							Number.isFinite(styleWidth) ? styleWidth : null
						),
					};
				},
				priority: 1,
			}),
		};
	}

	exportDOM() {
		const img = document.createElement("img");
		img.setAttribute("src", this.__src);
		if (this.__altText) img.setAttribute("alt", this.__altText);
		if (this.__publicId) img.setAttribute("data-cloudinary-id", this.__publicId);
		if (this.__width) img.setAttribute("style", `width:${this.__width}px;max-width:100%;`);
		return { element: img };
	}

	decorate() {
		return <ImageComponent nodeKey={this.getKey()} src={this.__src} altText={this.__altText} width={this.__width} />;
	}

	isInline() {
		return false;
	}
}

export function $createImageNode(src, altText, publicId, width) {
	return new ImageNode(src, altText, publicId, width);
}

export function $isImageNode(node) {
	return node instanceof ImageNode;
}
