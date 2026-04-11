# n8n-nodes-pdf-page-extract-next

A community n8n node that extracts text and images from a specific page of a PDF file.

---

## Installation

1. Open your n8n instance
2. Go to **Settings → Community Nodes**
3. Click **Install**
4. Enter the package name: `n8n-nodes-pdf-page-extract-next`
5. Click **Install** and wait for the process to complete
6. Restart n8n when prompted

Once installed, the **PDF Page Extract Next** node will appear in your node panel.

---

## Operations

### Extract Pages With Images

Extracts text and all embedded images from a single page of a PDF.

| Parameter | Type | Default | Description |
|---|---|---|---|
| Binary Property | string | `data` | Name of the binary property on the input item that holds the PDF file |
| Page Number | number | `1` | The page number to extract content from |
| Image Timeout (ms) | number | `5000` | How long to wait for image extraction per page before skipping |

---

## Output

### JSON
```json
{
  "pageNumber": 3,
  "text": "Extracted text content from page 3..."
}
```

### Binary
Every image found on the page is output as a separate binary property named `page_{n}_image_{k}`:

| Binary Key | Description |
|---|---|
| `page_3_image_1` | First image on page 3 |
| `page_3_image_2` | Second image on page 3 |

If no images are found on the page, the binary output will be empty.

---

## Usage

### Extract a single page

1. Add a node that provides a PDF as binary data (e.g. **Read/Write Files from Disk**, **HTTP Request**, **Google Drive**)
2. Connect it to **PDF Page Extract Next**
3. Set **Binary Property** to the name of the binary field holding your PDF (default: `data`)
4. Set **Page Number** to the page you want to extract
5. Run the node — output will contain the page text in JSON and images as binary properties

---

### Extract all pages using a loop

To process every page of a PDF:

1. Load the PDF using any file node
2. Add a **Code** node to generate page numbers (replace `20` with your PDF's total pages):
```javascript
const totalPages = 20;
return Array.from({ length: totalPages }, (_, i) => ({ json: { page: i + 1 } }));
```
3. Connect the **Code** node to **PDF Page Extract Next**
4. Set **Page Number** to `{{ $json.page }}`
5. Each execution returns the text and images for that page independently

---

## Notes

- Pages with no images will still return text successfully
- If image extraction exceeds the timeout, text is still returned and the node continues without error
- All images are output in `image/png` format
- Enable **Continue On Fail** in node settings to handle errors gracefully without stopping the workflow


---

## Author

**Arsalan Mughal**
- GitHub: [@arslanmughal99](https://github.com/arslanmughal99)
- Repository: [n8n-nodes-pdf-page-extract-next](https://github.com/arslanmughal99/n8n-nodes-pdf-page-extract-next)

---

## License

[MIT](LICENSE.md)
