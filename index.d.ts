declare module 'tiled-tmx-parser' {
	export function readFile(name: string, callback: (err: any | null, data: string) => void);

	export function parseFile(path: string, callback: (err: any | null, map: Map) => void);

	export function parse(xmlContent: string, pathToFile: string, callback: (err: any | null, map: Map) => void);

	export class Map<TMapProps = Properties, TTileLayerProps = Properties, TTileProps = Properties, TObjectLayerProps = Properties, TObjectProps = Properties, TImageLayerProps = Properties> {
		public version: string;
		public orientation: 'orthogonal' | 'isometric' | 'staggered' | 'hexagonal' | string;
		public width: number;
		public height: number;
		public tileWidth: number;
		public tileHeight: number;
		public backgroundColor: string | null;
		public layers: (TileLayer<TTileLayerProps, TTileProps> | ObjectLayer<TObjectLayerProps, TObjectProps> | ImageLayer<TImageLayerProps>)[];
		public properties: TMapProps;
		public tileSets: TileSet[];
	}

	export class TileSet<T = Properties> {
		firstGid: number;
		source: string;
		name: string;
		tileWidth: number;
		tileHeight: number;
		spacing: number;
		margin: number;
		tileOffset: { x: number, y: number };
		properties: T;
		image: Image;
		tiles: Tile[];
		terrainTypes: Terrain[];

		mergeTo(other: TileSet): void;
	}

	export class Image {
		format: string;
		source: string;
		trans: null | number;
		width: number;
		height: number;
	}

	export class Tile<T = Properties> {
		id: number;
		gid: number;
		terrain: [];
		probability: number | null;
		properties: T;
		animations: [];
		image: null | Image;
	}

	export class TileLayer<T = Properties, TTileProps = Properties> implements Layer<T> {
		constructor(map: Map);

		map: Map;
		type: 'tile';
		name: null | string;
		opacity: number;
		visible: boolean;
		properties: T;
		tiles: Tile<TTileProps>[];
		horizontalFlips: [];
		verticalFlips: [];
		diagonalFlips: [];

		tileAt(x: number, y: number): Tile<TTileProps> | null;

		setTileAt(x: number, y: number, tile: Tile): void;
	}

	export class ObjectLayer<T = Properties, TObjectProps = Properties> implements Layer<T> {
		constructor();

		name: string | null;
		opacity: number;
		properties: T;
		type: 'object';
		visible: boolean;
		color: null | string;
		objects: TmxObject<TObjectProps>[];
	}

	export class ImageLayer<T = Properties> implements Layer<T> {
		constructor();

		name: string | null;
		opacity: number;
		properties: T;
		type: 'image';
		visible: boolean;
		image: Image | null;
		x: number;
		y: number;
	}

	export class TmxObject<T = Properties> {
		constructor();

		id: number;
		name: null | string;
		type: null | string;
		x: number;
		y: number;
		width: number;
		height: number;
		rotation: number;
		properties: T;
		gid: null | number;
		visible: boolean;
		ellipse: boolean;
		polygon: null | any;
		polyline: null | any;
	}

	export class Terrain<T = Properties> {
		constructor();

		properties: T;
		name: string;
		tile: number;
	}

	interface Layer<T = Properties> {
		type: 'object' | 'image' | 'tile';
		name: null | string;
		opacity: number;
		visible: boolean;
		properties: T;
	}

	export type Properties = { [key: string]: boolean | string | number };
}
