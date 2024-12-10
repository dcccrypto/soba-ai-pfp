function GenerationResult({ generation }) {
    return (
        <div className="generation-result">
            <img 
                src={generation.result_url} 
                alt={generation.prompt}
                className="generated-image"
            />
        </div>
    );
}

export default GenerationResult; 