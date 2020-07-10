import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DialoguePage from '../DialoguePage/DialoguePage';

const Story = (props) => {

    const { chapt } = props.match.params;

    const [dialogue, setDialogue] = useState([]);
    const [page, setPage] = useState(1);
    const [response, setResponse] = useState();    

    useEffect(() => {
        fetch(`http://localhost:8000/api/dialogue/${chapt}`)
            .then(res => {
                if (res.ok) {
                    return res.json();
                }
                throw new Error (res.statusText);
            })
            .then(data => {
                data.sort((a, b) => a.page - b.page);
                console.log(data);
                setDialogue(data);
            });
    }, [chapt]);

    return (
        <div>
            {dialogue.length ? <h2>{dialogue[0].story_title}</h2> : <p>Loading...</p>}
            {dialogue.length ? 
                <DialoguePage 
                    data={{
                        response,
                        page,
                        setPage,
                        setResponse,
                        dialogue,
                    }}
                /> : ''}
            {dialogue.length && dialogue.length === page 
                ? <Link 
                    to={`/game/exercise/${chapt}/learn`}
                >Begin Exercise</Link>
                : ''
            }
        </div>
    );
}

export default Story;