import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'

import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import DatePicker from 'react-datepicker'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import Toast from 'react-bootstrap/Toast'
import InputGroup from 'react-bootstrap/InputGroup'
import Alert from 'react-bootstrap/Alert'
const Multiselect = dynamic(() => import('multiselect-react-dropdown').then(module => module.Multiselect),{
    ssr: false
})

import Autosuggest from './Autosuggest'

import { FaUpload, FaCheckCircle, FaTimesCircle, FaPlusSquare } from 'react-icons/fa'
import { AiFillCloseCircle } from 'react-icons/ai'

import connectToExtension from '../utils/extension'
import { domain } from '../config/config'

const regex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)

export default function GigForm(props) {

    const communities = props.communities
    const [inputFields, setInputFields] = useState({
        title: '',
        description: '',
        submissionCount: '',
        community: '',
        gigStartDate: Date.now(),
        gigEndDate: Date.now(),
        type: '',
        reward: 0,
        skillDetails: [],
        virtues: [],
        externalLinks: [],
        encryptedFile: null,
        encryptedKey: null
    })

    const [showToast, toggleToastShow] = useState(false)
    const [toastType, toggleToastType] = useState()
    const [toastMessage, setToastMessage] = useState()

    const [selectedFile, setSelectedFile] = useState(null)
    useEffect(() => {
        if (selectedFile) setLoading(true)
        else setLoading(false)
    }, [selectedFile])

    const [isUploaded, toggleUploaded] = useState(false)

    // TODO: Isolate shield functions into a single file
    const [isLoading, setLoading] = useState(false)
    useEffect(() => {
        if (isLoading) {
            let reader = new FileReader()
            reader.readAsDataURL(selectedFile)
            reader.onload = () => {
                let request = {}
                var filedata = reader.result
                request.query = 'encrypt'
                request.data = filedata
                connectToExtension(request)
                .then((response) => {
                    if (response && response.status == 'SUCCESS') {
                        setInputFields({...inputFields, encryptedFile: response.encryptedFile, encryptedKey: response.encryptedKey})
                        // File was uploaded and encrypted
                        // change loading state and button text
                        // Button color should change and say file 
                        // uploaded and encrypted. Also selectedFile 
                        // should be set to null and setLoading 
                        // should be set to false.
                        toggleUploaded(true)
                        setSelectedFile(null)
                    }
                })
            }
        } else {

        }
    }, [isLoading])

    const handleUpdate = (name, value) => {
        let currentFieldValues = {...inputFields}
        if (name === "skillDetails") {
            if (currentFieldValues[name].includes(value)) return
            if (currentFieldValues[name].length === 5) return
            currentFieldValues[name].push(value)
            setInputFields(currentFieldValues)
            document.getElementsByName('searchSkillDetail')[0].setCustomValidity('')
            return
        } 
        currentFieldValues[name] = value
        setInputFields(currentFieldValues)
        return
    }

    const removeSkillFromList = (detail) => {
        let skillDetails = inputFields.skillDetails
        let newSkillDetails = skillDetails.filter(x => x !== detail)
        setInputFields({...inputFields, skillDetails: newSkillDetails})
    }

    const setDate = (date, name) => {
        let currentFields = {...inputFields}
        currentFields[name] = date
        setInputFields(currentFields)
    }

    const handleChange = (e) => {
        let currentFields = {...inputFields}
        currentFields[e.target.name] = e.target.value
        setInputFields(currentFields)
    }

    const handleFileRemove = () => {
        // TODO: Fix - Hidden button is also clicked.
        toggleUploaded(false)
        setInputFields({...inputFields, encryptedFile: '', encryptedKey: ''})
    }

    const handleSubmit = (e) => {


        e.preventDefault()

        // TODO: Form validation, skills field and file have issues.
        fetch(domain + '/application/listen/gigs/addGig', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + Cookies.get('token')
            },
            body: JSON.stringify(inputFields) 
        })
        .then(response => response.json())
        .then(data => {
            if (data.status && data.status === 'SUCCESS') {
                setToastMessage('Successfully added gig to the platform.')
                toggleToastType('success')
                toggleToastShow(true)
                setTimeout(() => {
                    location.reload()
                }, 3000)
            } else {
                setToastMessage('Unable to add gig to platform at the moment.')
                toggleToastType('danger')
                toggleToastShow(true)
            }
        }) 
    }

    const virtues = ['honesty', 'hardwork', 'intergrity']

    const handleSelect = (list) => {
        setInputFields({...inputFields, virtues: list})
    }

    const [linkInput, updateLinkInput] = useState('')
    const [linkError, setLinkError] = useState('')

    const handleLink = () => {
        if (linkInput == '') return
        if (inputFields.externalLinks.length >= 5) {
            setLinkError('Already 5 URLs added')
            return
        }
        if (isValidURL(linkInput)) {
            // Push to externalLinks
            let tempExternalLinks = inputFields.externalLinks
            tempExternalLinks.push(linkInput)
            setInputFields({...inputFields, externalLinks: tempExternalLinks})
            updateLinkInput('')
        } else {
            setLinkError('Invalid URL format')
        }
    }

    const handleLinkRemove = (link) => {
        let tempExternalLinks = inputFields.externalLinks
        tempExternalLinks.splice(tempExternalLinks.indexOf(link), 1)
        setInputFields({...inputFields, externalLinks: tempExternalLinks})
    }

    const handleLinkKeyDown = (e) => {
        if (e.keyCode == 13) {
            e.preventDefault()
            handleLink()
            return
        }
    }

    const isValidURL = (input) => {
        return input.match(regex)
    }

    return (
        <>
            <Form onSubmit={(e) => handleSubmit(e)} className="mt-4">
                <Form.Row className="justify-content-center">
                    <Form.Group as={Col} controlId="title" xs={10} md={10} lg={8} >
                        <Form.Control type="text" placeholder="Title for the gig" name="title" value={inputFields.title} onChange={(e) => handleChange(e)} required />
                    </Form.Group>
                </Form.Row>
                <Form.Row className="justify-content-center">
                    <Form.Group as={Col} controlId="description" xs={10} md={10} lg={8} >
                        <Form.Control as="textarea" placeholder="Give a small description" rows={4} value={inputFields.description} name="description" onChange={(e) => handleChange(e)} required />
                    </Form.Group>
                </Form.Row>
                <Form.Row className="justify-content-center">
                    <Form.Group as={Col} controlId="submissionCount" xs={10} md={4} lg={4}>
                        <Form.Control type="number" value={inputFields.submissionCount} placeholder="Enter maximum number of submissions" name="submissionCount" onChange={(e) => handleChange(e)} required />
                    </Form.Group>
                    <Form.Group as={Col} controlId="community" xs={10} md={4} lg={4}>
                        <Form.Control as="select" placeholder="Select the community" name="community" value={inputFields.community} className="text-capitalize" onChange={(e) => handleChange(e)}  required>
                            {
                                communities?.map((c, k) => {
                                    return <option key={k} value={c._id} className="text-capitalize">{c.name}</option>
                                })
                            }
                            <option disabled>Select the community</option>
                        </Form.Control>
                    </Form.Group>
                </Form.Row>
                <Form.Row className="justify-content-center">
                    <Form.Group as={Col} controlId="gigStartDate" xs={10} md={4} lg={4}>
                        <DatePicker 
                            onChange={(date) => setDate(date, "gigStartDate")}
                            selected={new Date(inputFields.gigStartDate)}
                            className="form-control d-block" 
                            placeholderText="Start date" 
                            name="gigStartDate"
                            minDate={new Date()}
                            dropdownMode="select"
                            required
                        />
                    </Form.Group>
                    <Form.Group as={Col} controlId="gigEndDate" xs={10} md={4} lg={4}>
                        <DatePicker 
                            onChange={(date) => setDate(date, "gigEndDate")}
                            selected={new Date(inputFields.gigEndDate)}
                            className="form-control d-block" 
                            placeholderText="End date" 
                            name="gigStartDate"
                            minDate={inputFields.gigStartDate}
                            dropdownMode="select"
                            required
                        />
                    </Form.Group>
                </Form.Row>
                <Form.Row className="justify-content-center">
                    <Form.Group as={Col} controlId="type" xs={10} md={4} lg={4}>
                        <Form.Control as="select" placeholder="Select Gig Type" name="type" onChange={(e) => handleChange(e)} required>
                            <option disabled>Select a type</option>
                            <option value="0">Apprenticeship</option>
                            <option value="1">Paid Gig</option>
                        </Form.Control>
                    </Form.Group>
                    <Form.Group as={Col} controlId="reward" xs={10} md={4} lg={4}>
                        <Form.Control type="text" placeholder="Reward Amount (INR)" name="reward" onChange={(e) => handleChange(e)} disabled={inputFields.type == 0} required />
                    </Form.Group>
                </Form.Row>
                <Form.Row className="justify-content-center"> 
                    <Form.Group as={Col} controlId="searchSkillDetail" xs={10} md={4} lg={4}>
                        <Autosuggest placeholder="Add upto 5 related skills"  name="searchSkillDetail" value="" addToList={(data) => handleUpdate("skillDetails", data)} />
                        <Form.Text>
                            {inputFields.skillDetails.map((detail, index) => (
                                <a onClick={() => removeSkillFromList(detail)} key={index} >
                                    <Badge pill variant="dark" className="m-1 btn skillBadge">{detail} <AiFillCloseCircle /></Badge>
                                </a>
                            ))}
                        </Form.Text>
                    </Form.Group>
                    <Form.Group as={Col} controlId="file" xs={10} md={4} lg={4}>
                        <Multiselect
                            options={virtues}
                            onSelect={(list) => handleSelect(list)}
                            onRemove={(list) => handleSelect(list)}
                            showCheckbox={true}
                            isObject={false}
                            placeholder="Select virtues"
                            avoidHighlightFirstOption={true}
                        />
                    </Form.Group>
                </Form.Row>
                <Form.Row className="justify-content-center">
                    <Form.Group as={Col} controlId="links" xs={10} md={4} lg={4}>
                        <InputGroup className="mb-1">
                            <Form.Control type="url" placeholder="Add upto 5 external resouce links here" name="links" value={linkInput} onChange={(e) => updateLinkInput(e.target.value)} onBlur={() => handleLink()} onFocus={() => setLinkError('')} onKeyDown={(e) => handleLinkKeyDown(e)} />
                            <InputGroup.Append><Button variant="outline-secondary" onClick={() => handleLink()} ><FaPlusSquare /></Button></InputGroup.Append>
                        </InputGroup>
                        <Form.Text id="linkErrorBlock" className="text-danger">
                            {linkError}
                        </Form.Text>
                        <Form.Text id="externalLinksBlock" className="text-success font-italic">
                            {
                                inputFields.externalLinks.map((l, i) => {
                                    return (
                                        <>
                                            <p className="p-0 m-0" key={i}>
                                                <a href="/">{l}</a>
                                                <AiFillCloseCircle className="float-right mt-1 text-danger" onClick={() => {handleLinkRemove(l)}} />
                                            </p>
                                        </>
                                    )
                                })
                            }
                        </Form.Text>
                    </Form.Group>
                    <Form.Group as={Col} controlId="file" xs={10} md={4} lg={4}>
                        <input style={{zIndex: -1}} type="file" id="actual-btn" onChange={(e) => setSelectedFile(e.target.files[0])} hidden></input>
                        {
                            (isUploaded) ?
                            <label htmlFor="actual-btn" className="btn btn-success w-100"><FaCheckCircle className="mb-1" /> File Uploaded<FaTimesCircle style={{zIndex: 1}} className="float-right mt-1" onClick={() => handleFileRemove()} /></label>
                            :
                            <label htmlFor="actual-btn" className="btn btn-info w-100"><FaUpload className="mb-1" /> {isLoading ? ' Loading...' : ' Add Document'}</label>
                        }
                        <Form.Text id="passwordHelpBlock" muted>
                            Uploading a private document is optional. But if added, the gig worker is required to apply to the gig
                            before they can upload a solution.
                        </Form.Text>
                    </Form.Group>
                </Form.Row>
                <Form.Row className="justify-content-center">
                    <Col className="form-group text-right" xs={10} md={8} lg={8}>
                        <Button type="submit" className="btn btn-primary m-1">Add Gig</Button>
                    </Col>
                </Form.Row>
            </Form>
            
            <Row className="justify-content-center fixed-bottom mb-2">
                <Col xs={10} lg={8} md={8}>
                    <Toast delay={3000} show={showToast} className={"bg-" + toastType} autohide>
                        <Toast.Header>
                            Notification
                        </Toast.Header>
                        <Toast.Body>
                            {toastMessage}
                        </Toast.Body>
                    </Toast>
                </Col>
            </Row>
        </>
    )
}
