import React from 'react';

const UPLOAD_SIZE_LIMIT_IN_MO = 1;

const FileUpload = ({ selectedFile, setSelectedFile }) => {
  const onFileChange = (event) => {
    // Update the state
    const fileSize = event.target.files.item(0).size;
    const fileMb = fileSize / 1024 ** 2;
    if (fileMb < UPLOAD_SIZE_LIMIT_IN_MO) {
      setSelectedFile(event.target.files[0]);
    } else {
      alert('Le fichier ne peux pas faire plus de ');
    }
  };

  // File content to be displayed after
  // file upload is complete
  let url;
  if (selectedFile) {
    url = URL.createObjectURL(selectedFile);
  }

  const fileData = () => {
    if (url) {
      return (
        <>
          <br />
          <div style={{ height: 150, width: 240 }}>
            <img
              src={url}
              style={{
                height: 'auto',
                width: 'auto',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            />
          </div>
          <a onClick={() => setSelectedFile(undefined)}>supprimer 🗑️</a>
        </>
      );
    } else {
      return;
    }
  };

  return (
    <div className="form__group">
      <label htmlFor="mission">
        <strong>Image</strong>
        <br />
        Une image rectangulaire idéalement d'un ratio de 16:9 pour présenter le
        produit
      </label>
      {!selectedFile && (
        <div
          style={{
            justifyContent: 'center',
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'flex',
            marginTop: '10px',
          }}
        >
          <input
            id="file"
            type="file"
            accept=".png,.jpg,.jpeg"
            onChange={onFileChange}
            style={{
              display: 'none',
            }}
          />
          <br></br>
          <label
            style={{
              border: '1px dashed #ccc',
              display: 'inline-block',
              padding: '6px 12px',
              cursor: 'pointer',
            }}
            htmlFor="file"
          >
            Selectionne une image rectangulaire
          </label>
        </div>
      )}

      {fileData()}
    </div>
  );
};

export default FileUpload;
