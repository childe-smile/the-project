// Lightweight asset model helpers
export function createAsset({
	id = crypto?.randomUUID?.() ?? String(Date.now()),
	name = "Untitled",
	type = "image",
	src = "",
	thumbnail = "",
	meta = {}
} = {}) {
	const now = new Date().toISOString();
	return {
		id,
		name,
		type,
		src,
		thumbnail,
		meta,
		createdAt: now,
		updatedAt: now
	};
}

export function formatAssetLabel(asset) {
	if (!asset) return "";
	return `${asset.name} ${asset.type ? `· ${asset.type}` : ""}`.trim();
}

export function isImageAsset(asset) {
	return asset && (asset.type === "image" || /image\//.test(asset.meta?.mime || ""));
}

