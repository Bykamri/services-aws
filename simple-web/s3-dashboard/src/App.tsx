import React, { useState, useEffect } from 'react';

// Sesuaikan API_URL dengan IP EC2-mu (jangan lupa port 5000)
// Contoh: http://13.212.xx.xx:5000/api/images
const API_URL = import.meta.env.VITE_API_URL;

// Tambahkan validasi kecil (opsional tapi disarankan) agar TypeScript tidak protes
if (!API_URL) {
  console.error("VITE_API_URL belum disetel di file .env!");
}

interface ImageItem {
  filename: string;
  key: string;
}

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchImages = async () => {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.status === 'success') {
        setImages(result.data);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        setSelectedFile(null); // Reset form
        fetchImages(); // Refresh tabel setelah berhasil
      } else {
        alert('Upload gagal: ' + result.message);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    const confirmDelete = window.confirm(`Yakin ingin menghapus ${filename}?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/${filename}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.status === 'success') {
        fetchImages(); // Refresh tabel setelah dihapus
      } else {
        alert('Gagal menghapus: ' + result.message);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>S3 Image Dashboard</h2>
      
      {/* Container Upload */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <form onSubmit={handleUpload} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <button 
            type="submit" 
            disabled={!selectedFile || isLoading}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: (selectedFile && !isLoading) ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (selectedFile && !isLoading) ? 'pointer' : 'not-allowed' 
            }}
          >
            {isLoading ? 'Mengunggah...' : 'Upload Gambar'}
          </button>
        </form>
      </div>

      {/* Tabel Data */}
      <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ backgroundColor: '#343a40', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>Nama File</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>S3 Key</th>
            <th style={{ padding: '12px', border: '1px solid #ddd', width: '100px', textAlign: 'center' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {images.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ padding: '20px', textAlign: 'center', border: '1px solid #ddd', color: '#666' }}>
                Belum ada gambar di S3.
              </td>
            </tr>
          ) : (
            images.map((img) => (
              <tr key={img.key} style={{ backgroundColor: 'white' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{img.filename}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{img.key}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleDelete(img.filename)}
                    style={{ 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      padding: '6px 12px', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default App;
