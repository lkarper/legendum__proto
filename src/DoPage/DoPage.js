import React, { useState, useContext, useEffect } from 'react';
import { Link, withRouter } from 'react-router-dom';
import xss from 'xss';
import PropTypes from 'prop-types';
import TokenService from '../services/token-service';
import ProgressService from '../services/progress-service';
import UserContext from '../contexts/UserContext';
import UserIncorrect from '../UserIncorrect/UserIncorrect';
import UserCorrect from '../UserCorrect/UserCorrect';
import QuestionToDisplay from '../QuestionToDisplay/QuestionToDisplay';
import BackgroundImage from '../BackgroundImage/BackgroundImage';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './DoPage.css';

const DoPage = (props) => {
    const { 
        chapt, 
        savedUserInput, 
        pages, 
        page, 
        setPage, 
        setSavedUserInput,
    } = props;

    const context = useContext(UserContext);

    const [userCorrect, setUserCorrect] = useState();
    const [userIncorrect, setUserIncorrect] = useState();
    const [endQuiz, setEndQuiz] = useState(false);
    const [pageToDisplay, setPageToDisplay] = useState({});
    const [showLoading, setShowLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (error) {
            window.scrollTo(0, document.querySelector('.DoPage__api-error').offsetTop - document.querySelector('.Header__header').offsetHeight);
        }
    }, [error]);

    useEffect(() => {
        if (pages.length !== 0) {
            setPageToDisplay(pages[page - 1]);
        }
    }, [pages, page]);

    const checkAnswer = (event, userResponse) => {
        event.preventDefault();
        if (pageToDisplay.look_ahead) {
            // Look ahead pages save user input for future use
            setSavedUserInput({
                ...savedUserInput,
                [pageToDisplay.property_to_save]: xss(userResponse),
            });
            setUserIncorrect();
            setUserCorrect(userResponse);
        } else if (userResponse === pageToDisplay.correct_response) {
            setUserIncorrect();
            setUserCorrect(userResponse);
        } else {
            setUserCorrect();
            setUserIncorrect(userResponse);
        }
    }

    const onCompletion = (url) => {
        if (TokenService.hasAuthToken()) {
            setError(false);
            setShowLoading(true);
            ProgressService.postProgress(chapt)
                .then(progressObject => {
                    setShowLoading(false);
                    context.updateProgress(progressObject);
                    props.history.push(url);
                })
                .catch(error => {
                    setShowLoading(false);
                    setError(true);
                });
        }
    }

    if (pages.length === 0 && !showLoading) {
        return (
            <p>Error: Looks like something went wrong. Check your connection and try again.</p>
        );        
    } else {
        return (
            <section 
                className='DoPage__container'
                aria-live='polite'
            >
                <h2
                    className='DoPage__h2'
                >
                    {pageToDisplay.exercise_title}{' '}{pageToDisplay.exercise_translation}
                </h2>
                <BackgroundImage
                    classPrefix='DoPage'
                    imgUrl={pageToDisplay.background_image_url}
                    imageAltText={pageToDisplay.background_image_alt_text}
                >
                    <img
                        className='DoPage__image' 
                        src={pageToDisplay.image_url}
                        alt={pageToDisplay.image_alt_text}
                    />
                </BackgroundImage>
                <div className={`DoPage__text-container${endQuiz ? '-end' : '' }`}>
                    {!endQuiz &&
                        <>
                            <QuestionToDisplay 
                                pageToDisplay={pageToDisplay}
                                savedUserInput={savedUserInput}
                                checkAnswer={checkAnswer}
                            />
                            <div 
                                role='alert' 
                                className='DoPage__check-answer-container'
                            >
                                {userIncorrect && <UserIncorrect page={pageToDisplay} userResponse={userIncorrect} />}
                                {userCorrect && <UserCorrect page={pageToDisplay} userResponse={userCorrect} />}
                            </div>
                        </>
                    }
                    <div className='DoPage__button-container'>
                        <button
                            className='DoPage__nav-button button'
                            disabled={page === 1} 
                            onClick={() => {
                                setUserCorrect();
                                setUserIncorrect();
                                if (endQuiz) {
                                    setEndQuiz(false);
                                } else {
                                    setPage(page - 1);
                                }
                            }}
                        >
                            &#60;
                        </button>
                        <button 
                            className='DoPage__nav-button button'
                            disabled={!userCorrect}
                            onClick={() => {
                                setUserCorrect();
                                setUserIncorrect();
                                if (page !== pages.length) {
                                    setPage(page + 1);
                                } else {
                                    setEndQuiz(true);
                                }
                            }}
                        >
                            &#62;
                        </button>
                    </div>
                    <div 
                        role='alert' 
                        className='DoPage__end-quiz-container'
                    >
                        {endQuiz && 
                            <>
                                {TokenService.hasAuthToken()
                                    ? 
                                        <> 
                                            {parseInt(chapt) !== context.exercises.length 
                                                ?
                                                    <button
                                                        className='button'
                                                        onClick={() => onCompletion(`/game/story/${parseInt(chapt) + 1}`)} 
                                                    >
                                                        On to the next chapter (progress will be saved)
                                                    </button>
                                                :
                                                    <p>To be continued...check back soon!</p>
                                            }
                                            <button
                                                className='button'
                                                onClick={() => onCompletion(`/dashboard`)} 
                                            >
                                                Back to the dashboard (progress will be saved)
                                            </button>
                                            <Link
                                                className='DoPage__link button'
                                                to='/dashboard'
                                            >
                                                Back to dashboard (do not save progress)
                                            </Link>
                                        </>
                                    : 
                                        parseInt(chapt) !== context.exercises.length 
                                            ?
                                                <Link 
                                                    className='DoPage__link button' 
                                                    to={`/game/story/${parseInt(chapt) + 1}`}
                                                >
                                                    On the the next chapter
                                                </Link>
                                            :
                                                <p>To be continued...check back soon!</p>
                                }
                            </> 
                        }
                        {error &&  
                            <div
                                className='DoPage__api-error'
                            >
                                <h2>Error: Could not save progress</h2>
                                <p>Check your connection, then click one of the options above to try again.</p>
                            </div>
                        }
                    </div>
                </div>
                {showLoading && <LoadingSpinner />}
            </section>
        );   
    }
}

DoPage.defaultProps = { 
    chapt: '', 
    savedUserInput: {}, 
    pages: [], 
    page: 1, 
    setPage: () => {}, 
    setSavedUserInput: () => {},
};

DoPage.propTypes = { 
    chapt: PropTypes.string, 
    savedUserInput: PropTypes.object, 
    pages: PropTypes.arrayOf(PropTypes.object), 
    page: PropTypes.number, 
    setPage: PropTypes.func, 
    setSavedUserInput: PropTypes.func,
};
                    
export default withRouter(DoPage);
