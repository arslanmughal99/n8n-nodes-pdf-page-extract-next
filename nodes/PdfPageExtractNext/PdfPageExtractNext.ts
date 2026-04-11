import type {
	INodeType,
	IExecuteFunctions,
	INodeExecutionData,
	INodeTypeDescription,
} from 'n8n-workflow';
import { EmbeddedImage, PDFParse } from 'pdf-parse';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class PdfPageExtractNext implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF Page Extract Next',
		name: 'pdfPageExtractNext',
		icon: { light: 'file:icon.svg', dark: 'file:icon.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Extract text and images from a specific page of a PDF',
		defaults: {
			name: 'PDF Page Extract Next',
		},
		subtitle: '={{$parameter["operation"]}}',
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Extract Pages Text With Images',
						value: 'extractPages',
						description: 'Extract text and images from a specific page of a PDF',
						action: 'Extract text and images from a specific page of a PDF',
					},
				],
				default: 'extractPages',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['extractPages'],
					},
				},
				description: 'Name of the binary property which contains the PDF data',
			},
			{
				displayName: 'Page Number',
				name: 'pageNumber',
				type: 'number',
				default: 1,
				required: true,
				displayOptions: {
					show: {
						operation: ['extractPages'],
					},
				},
				description: 'Page number to extract text and images from',
			},
			{
				displayName: 'Image Timeout Milliseconds',
				name: 'imageTimeout',
				type: 'number',
				default: 5000,
				displayOptions: {
					show: {
						operation: ['extractPages'],
					},
				},
				description: 'Timeout in milliseconds for extracting images from each page',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
				const imageTimeout = this.getNodeParameter('imageTimeout', i) as number;
				const pageNumber = this.getNodeParameter('pageNumber', i) as number;

				if (!items[i].binary) {
					throw new NodeOperationError(this.getNode(), 'No binary data exists on item!');
				}

				const binaryData = items[i].binary as Record<
					string,
					{ data: string; fileName?: string; mimeType?: string }
				>;

				if (!binaryData[binaryPropertyName]) {
					throw new NodeOperationError(
						this.getNode(),
						`Binary data property "${binaryPropertyName}" does not exist on item!`,
					);
				}

				const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

				if (buffer.length === 0) {
					throw new NodeOperationError(this.getNode(), 'PDF binary data is empty after decoding!');
				}

				const parser = new PDFParse({ data: buffer });

				// Get text for single page
				const pagesText = await parser.getText({ partial: [pageNumber] });

				// Get images for single page
				let pageImages: EmbeddedImage[] = [];
				try {
					const result = (await Promise.race([
						parser.getImage({ partial: [pageNumber] }),
						new Promise((_, reject) =>
							setTimeout(() => reject(new Error(`Timeout on page ${pageNumber}`)), imageTimeout),
						),
					])) as Awaited<ReturnType<typeof parser.getImage>>;

					pageImages = result.pages[0]?.images ?? [];
				} catch {
					pageImages = [];
				}

				// Build output
				const binaryOutput: Record<string, any> = {};

				for (let k = 0; k < pageImages.length; k++) {
					const img = pageImages[k];
					const imgBuffer = Buffer.from(img.data);
					const binaryKey = `page_${pageNumber}_image_${k + 1}`;

					binaryOutput[binaryKey] = await this.helpers.prepareBinaryData(
						imgBuffer,
						img.name ?? `${binaryKey}.png`,
						'image/png',
					);
				}

				returnData.push({
					json: {
						pageNumber,
						text: pagesText.pages[0]?.text ?? '',
					},
					binary: binaryOutput,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						binary: items[i].binary,
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
