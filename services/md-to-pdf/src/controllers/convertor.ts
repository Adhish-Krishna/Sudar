import { mdToPdf } from "md-to-pdf";
import type { Request, Response } from "express";

const convertor = async (req: Request, res: Response) => {
    const file = (req as any).file;
    if (!file) {
        return res.status(400).json({ error: 'No markdown file uploaded' });
    }

    try {
        const pdf = await mdToPdf(
            { content: file.buffer.toString() },
            {
                launch_options: {
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                },
            },
        );
        res.status(200);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalname.replace(/\.md$/, '.pdf')}"`);
        res.send(pdf.content);
    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ error: 'Failed to convert markdown to PDF' });
    }
};

export default convertor;