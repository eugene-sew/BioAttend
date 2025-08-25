import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import CameraCapture from './CameraCapture';

describe('CameraCapture', () => {
  let mockOnCapture;
  let mockOnClose;
  let mockStream;
  let mockVideoElement;
  let mockCanvasContext;

  beforeEach(() => {
    mockOnCapture = vi.fn();
    mockOnClose = vi.fn();
    
    // Mock video stream
    mockStream = {
      getTracks: vi.fn(() => [
        { stop: vi.fn(), kind: 'video' }
      ]),
    };

    // Mock getUserMedia
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream);

    // Mock canvas context for capture
    mockCanvasContext = {
      drawImage: vi.fn(),
    };

    // Mock HTMLCanvasElement.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext);
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,fake_image_data');

    // Mock video element properties
    mockVideoElement = {
      videoWidth: 640,
      videoHeight: 480,
    };
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
      get: () => mockVideoElement.videoWidth,
    });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
      get: () => mockVideoElement.videoHeight,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <CameraCapture
        isOpen={false}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <CameraCapture
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Capture Photo for Attendance')).toBeInTheDocument();
    expect(screen.getByText(/Position your face clearly/)).toBeInTheDocument();
  });

  it('should request camera access when opened', async () => {
    render(
      <CameraCapture
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
    });
  });

  it('should handle camera permission error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(
      new Error('Permission denied')
    );

    render(
      <CameraCapture
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Error accessing camera:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  it('should capture photo when capture button is clicked', async () => {
    render(
      <CameraCapture
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    // Wait for camera to initialize
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    // Click capture button
    const captureButton = screen.getByRole('button', { name: /capture photo/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      // Should draw video to canvas
      expect(mockCanvasContext.drawImage).toHaveBeenCalled();
      // Should show retake button instead of capture
      expect(screen.getByRole('button', { name: /retake/i })).toBeInTheDocument();
    });
  });

  it('should show preview after capture', async () => {
    render(
      <CameraCapture
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    const captureButton = screen.getByRole('button', { name: /capture photo/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      const image = screen.getByAltText('Captured');
      expect(image).toBeInTheDocument();
      expect(image.src).toContain('data:image/jpeg;base64');
    });
  });

  it('should allow retaking photo', async () => {
    render(
      <CameraCapture
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    // Capture first photo
    const captureButton = screen.getByRole('button', { name: /capture photo/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retake/i })).toBeInTheDocument();
    });

    // Click retake
    const retakeButton = screen.getByRole('button', { name: /retake/i });
    fireEvent.click(retakeButton);

    await waitFor(() => {
      // Should show capture button again
      expect(screen.getByRole('button', { name: /capture photo/i })).toBeInTheDocument();
      // Should request camera again
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    });
  });

  it('should confirm and send captured image', async () => {
    render(
      <CameraCapture
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    // Capture photo
    const captureButton = screen.getByRole('button', { name: /capture photo/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    // Confirm capture
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnCapture).toHaveBeenCalledWith('fake_image_data');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should switch camera when switch button is clicked', async () => {
    render(
      <CameraCapture
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    // Find and click switch camera button
    const switchButton = screen.getByTitle('Switch Camera');
    fireEvent.click(switchButton);

    await waitFor(() => {
      // Should request camera with environment facing mode
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            facingMode: 'environment',
          }),
        })
      );
    });
  });

  it('should close modal when backdrop is clicked', () => {
    render(
      <CameraCapture
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    // Click on backdrop
    const backdrop = document.querySelector('.bg-gray-500.bg-opacity-75');
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when cancel button is clicked', async () => {
    render(
      <CameraCapture
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should stop camera stream when closing', async () => {
    const { rerender } = render(
      <CameraCapture
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    const stopSpy = vi.spyOn(mockStream.getTracks()[0], 'stop');

    // Close the modal
    rerender(
      <CameraCapture
        isOpen={false}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    expect(stopSpy).toHaveBeenCalled();
  });

  it('should handle capture error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnCapture.mockRejectedValue(new Error('Upload failed'));

    render(
      <CameraCapture
        isOpen={true}
        onCapture={mockOnCapture}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    // Capture and confirm
    const captureButton = screen.getByRole('button', { name: /capture photo/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Error processing image:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });
});
