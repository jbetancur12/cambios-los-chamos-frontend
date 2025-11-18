import { useCallback } from 'react'
import type { ExchangeRate } from '@/types/api'

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}
export function useSiaRateImage() {
  const generateAndDownloadImage = useCallback(async (rate: ExchangeRate) => {
    console.log("🚀 ~ useSiaRateImage ~ rate:", rate)
    try {
      // Load main logo
      const mainLogo = new Image();
      mainLogo.src = '/LogoLosChamos.avif';

      await new Promise((resolve, reject) => {
        mainLogo.onload = resolve;
        mainLogo.onerror = reject;
      });

      // Load background image
      const img = new Image();
      img.src = '/rates-background.avif';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Load BCV logo
      const bcvLogo = new Image();
      bcvLogo.src = '/bcv.png'; // Ensure this path is correct

      await new Promise((resolve, reject) => {
        bcvLogo.onload = resolve;
        bcvLogo.onerror = reject;
      });

      // Canvas setup
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const offsetX = 30;
      const offsetY = 240;

      const cardWidth = img.width - 60;
      const cardHeight = 1040;

      // Draw main logo
      const mainLogoHeight = 400;
      const mainLogoWidth = (mainLogo.width / mainLogo.height) * mainLogoHeight;

      const mainLogoX = offsetX + (cardWidth / 2) - (mainLogoWidth / 2);
      const mainLogoY = offsetY - 320;

      ctx.drawImage(mainLogo, mainLogoX, mainLogoY, mainLogoWidth, mainLogoHeight);

      // ---- HEADER RED GRADIENT (INVERTED) ----
      const headerHeight = 50;
      const headerRadius = 8;
      const grad = ctx.createLinearGradient(offsetX, offsetY, offsetX + cardWidth, offsetY);
      grad.addColorStop(1, '#f80000');   // Dark Red (now at start/left)
      grad.addColorStop(0, '#510200');   // Light Red (now at end/right)

      ctx.fillStyle = grad;
      roundRect(ctx, offsetX, offsetY, cardWidth, headerHeight, headerRadius);
      ctx.fill()

      // Date
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';

      const dateStr = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      ctx.fillText(dateStr, offsetX + 30, offsetY + 32);

      // Sell Rate
      ctx.textAlign = 'right';
      ctx.fillText(
        'TASA ' + rate.sellRate.toFixed(1),
        offsetX + cardWidth - 30,
        offsetY + 32
      );

      // ---- TABLE HEADER (TEXT ONLY) ----
      const innerWidth = cardWidth - 60;
      const headerX = offsetX + 30;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';

      const colGap = 20;
      const colWidth = (innerWidth - colGap * 2) / 3;

      const col1X = headerX;
      const col2X = col1X + colWidth + colGap;
      const col3X = col2X + colWidth + colGap;

      // Column Titles (COP, BS, BCV Logo)
      ctx.fillText('COP', col1X + colWidth / 2, offsetY + 88);
      ctx.fillText('BS', col2X + colWidth / 2, offsetY + 88);

      const bcvLogoHeight = 45;
      const bcvLogoWidth = (bcvLogo.width / bcvLogo.height) * bcvLogoHeight;

      // Center logo horizontally and vertically in the column
      const bcvLogoX = col3X + (colWidth / 2) - (bcvLogoWidth / 2);
      const bcvLogoY = offsetY + 88 - (bcvLogoHeight / 2) - 5;

      ctx.drawImage(bcvLogo, bcvLogoX, bcvLogoY, bcvLogoWidth, bcvLogoHeight);

      // ---- DATA TABLE ----
      const amounts = [
        10000, 20000, 30000, 40000, 50000,
        60000, 70000, 80000, 90000, 100000,
        200000, 300000
      ];

      const rowHeight = 55;
      const rowGap = 10;
      const startY = offsetY + 150;

      amounts.forEach((amount, index) => {
        const y = startY + index * (rowHeight + rowGap);

        // Draw cell background
        ctx.fillStyle = '#260000';
        roundRect(ctx, col1X, y - 30, colWidth, rowHeight, 8);
        ctx.fill();

        roundRect(ctx, col2X, y - 30, colWidth, rowHeight, 8);
        ctx.fill();

        roundRect(ctx, col3X, y - 30, colWidth, rowHeight, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';

        // COP
        ctx.fillText(amount.toLocaleString('es-VE'), col1X + colWidth / 2, y);

        // BS (with thousands separator and two decimals)
        const bs = (amount / rate.sellRate);
        ctx.fillText(
          bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          col2X + colWidth / 2,
          y
        );

        // USD
        const usd = bs / rate.bcv;
        ctx.fillText(usd.toFixed(2), col3X + colWidth / 2, y);
      });

      // ---- FOOTER BCV (ROUNDED RECTANGLE) ----
      const footerRectWidth = 240;
      const footerRectHeight = 70;
      const footerRadius = 15;

      const footerX = 600
      const footerY = offsetY + cardHeight - 60 - (footerRectHeight / 2);

      ctx.fillStyle = grad; // Apply gradient to footer
      roundRect(ctx, footerX, footerY, footerRectWidth, footerRectHeight, footerRadius);
      ctx.fill();

      // Draw BCV logo
      const logoHeight = 60;
      const logoWidth = (bcvLogo.width / bcvLogo.height) * logoHeight;

      const logoX = footerX + 20;
      const logoY = footerY + (footerRectHeight / 2) - (logoHeight / 2);

      ctx.drawImage(bcvLogo, logoX, logoY, logoWidth, logoHeight);

      // Draw BCV rate value
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const bcvRateTextX = logoX + logoWidth + 60;
      const bcvRateTextY = footerY + (footerRectHeight / 2);

      // Display BCV rate
      ctx.fillText(
        rate.bcv.toFixed(2),
        bcvRateTextX,
        bcvRateTextY
      );

      // ---- EXPORT ----
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const dateForFilename = new Date().toISOString().split('T')[0];
          a.download = `tasa-sia-${dateForFilename}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }, []);

  return { generateAndDownloadImage }
}