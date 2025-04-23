import { Navigate, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { useEffect, useState } from "react"
import axiosInstance from "../utils/axiosInstance"
import TravelStoryCard from "../components/Cards/TravelStoryCard"
import { Slide, ToastContainer, toast } from 'react-toastify';
import { MdAdd, MdEdit, MdDelete, MdClose, MdLocationOn } from 'react-icons/md'  
import Modal from "react-modal"
import AddEditModal from "../components/AddEditModal"
import moment from "moment"
import { BASE_URL } from "../utils/constant"


export const Dashboard = () => {
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState<any>('')
  const [allStories, setAllStories] = useState([])
  const [detailModal, setDetailModal] = useState<{ isShown: boolean; story: any | null }>({
    isShown: false,
    story: null,
  })


  const transformImgUrl = (url: string) => {
    try {
      const match = url.match(/\/file\/d\/([^\/]+)(?:\/|$)/)
      const fileId = match?.[1] || new URL(url).searchParams.get("id")
      if (fileId) {
        return `${BASE_URL}/image/${fileId}`
      }
    } catch {
      // Handle error if needed
      console.error("Error transforming image URL")
    }
    return url
  }

  const openDetail = (story: any) => {
    setDetailModal({ isShown: true, story })
  }
  
  const closeDetail = () => {
    setDetailModal({ isShown: false, story: null })
  }
  
  const deleteStory = async (id: string) => {
    try {
      await axiosInstance.delete(`/delete-story/${id}`)
      toast.success("Story deleted successfully", {
        position: "bottom-right",
        autoClose: 3000,
      })
      getStories()
      closeDetail()
    } catch (error) {
      toast.error("Failed to delete story", {
        position: "bottom-right",
        autoClose: 3000,
      })
    }
  }

  const [ openAddEditModal, setOpenAddEditModal ] = useState({ 
    isShown: false, 
    type: "add", 
    data: null 
  })

  const openEditModal = (story: any) => {
    setOpenAddEditModal({ 
      isShown: true, 
      type: "edit", 
      data: story 
    })
    closeDetail() // Close the detail modal when editing
  }

  const isAuthenticated = !!localStorage.getItem('token')

  const getStories = async () => {
    try {
      const response = await axiosInstance.get('/get-allstory')
      if(response.data && response.data.travelStories) {
        setAllStories(response.data.travelStories)
      }
    } catch (error) {
      console.log("An Unexpected Error Occurred");
    }
  }
  
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get('/get-users')
      if(response.data && response.data.user) {
        setUserInfo(response.data.user)
      }
    } catch (error: any) {
      if(error.response?.status === 401) {
        localStorage.clear()
        navigate('/home')
      }
    }
  }
  
  useEffect(() => {
    getStories()
    getUserInfo()
    return () => {}
  }, [])

  const updateFavouriteClick = async (storyData: any) => {
    const id = storyData.id
    try {
      const response = await axiosInstance.put(`/favourite-story/${id}`, {
        isFavourite: !storyData.isFavourite
      })
      if(response.data && response.data.story) {
        getStories()
      }
      toast.success(`${storyData.isFavourite ? "Favourite Story Remove Successfully" : "Favourite Story Added Successfully"} `, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Slide
      })
    } catch (error) {
      console.log("An Unexpected Error Occurred");
    }
  }

  // Check if the current user is the author of the story
  const isAuthor = (story: any) => {
    return userInfo && story && userInfo.id === story.authorId;
  }

  if(!isAuthenticated) {
    return <Navigate to='/home' />
  }
  
  return (
    <div>
      <div>
        <Navbar userInfo={userInfo} />
      </div>
      <div className="container mx-auto p-10">
        <div className="flex gap-7">
          <div className="w-full">
            {allStories.length > 0 ?
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allStories.map((item: any) => {
                  return (
                    <TravelStoryCard 
                      key={item.id} 
                      imgUrl={transformImgUrl(item.imageUrl)}
                      title={item.title}
                      story={item.story}
                      date={item.visitedDate}
                      visitedLocation={item.visitedLocation}
                      isFavourite={item.isFavourite}
                      onClick={() => openDetail(item)}
                      onFavouriteClick={() => {updateFavouriteClick(item)}}
                    />
                  )
                })}
              </div> :
              <div className="text-center py-10 text-gray-500">
                No Stories Found
              </div>
            }
          </div>
        </div>
      </div>
      
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Slide} 
      />

      {/* Detail Modal */}
      <Modal 
        isOpen={detailModal.isShown} 
        onRequestClose={closeDetail} 
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          content: {
            width: '95%',
            maxWidth: '800px',
            margin: 'auto',
            borderRadius: '8px',
            padding: '16px',
            maxHeight: '90vh',
            overflow: 'auto'
          }
        }} 
        appElement={document.getElementById('root') as HTMLElement}
        contentLabel="Travel Story Details"
        className="ReactModal__Content scrollbar bg-lime-50"
      >
        {detailModal.story && (
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 pr-10 sm:pr-0">
                {detailModal.story.title}
              </h2>
              <div className="flex items-center gap-2 absolute top-4 right-4 sm:static">
                {isAuthor(detailModal.story) && (
                  <>
                    <button 
                      onClick={() => openEditModal(detailModal.story)}
                      className="p-1.5 sm:p-2 bg-lime-400 text-white rounded-full hover:bg-lime-500"
                      aria-label="Edit story"
                    >
                      <MdEdit className="text-lg" />
                    </button>
                    <button 
                      onClick={() => deleteStory(detailModal.story.id)}
                      className="p-1.5 sm:p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      aria-label="Delete story"
                    >
                      <MdDelete className="text-lg" />
                    </button>
                  </>
                )}
                <button 
                  onClick={closeDetail}
                  className="p-1.5 sm:p-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300"
                  aria-label="Close modal"
                >
                  <MdClose className="text-lg" />
                </button>
              </div>
            </div>
            
            <div className="relative rounded-lg overflow-hidden h-48 sm:h-72">
              <img 
                src={transformImgUrl(detailModal.story.imageUrl)}
                alt={detailModal.story.title}
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">
              <span>{moment(detailModal.story.visitedDate).format('MMM DD, YYYY')}</span>
              <span>•</span>
              <span>By {detailModal.story.author?.username || "Unknown"}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 my-1 sm:my-2">
              {detailModal.story.visitedLocation?.map((location: string, idx: number) => (
                <div key={idx} className="flex items-center gap-1 text-xs bg-lime-50 text-lime-600 px-2 py-1 rounded">
                  <MdLocationOn className="text-xs sm:text-sm" />
                  <span>{location}</span>
                </div>
              ))}
            </div>
            
            <div className="text-sm sm:text-base text-slate-700 whitespace-pre-wrap">
              {detailModal.story.story}
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={openAddEditModal.isShown} 
        onRequestClose={() => {
          setOpenAddEditModal({ isShown: false, type: "add", data: null })
        }} 
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 999
          }
        }} 
        appElement={document.getElementById('root') as HTMLElement}
        className={"model-box"}
        contentLabel="Add Travel Stories"
      >
        <AddEditModal
          type={openAddEditModal.type}
          storyInfo={openAddEditModal.data}
          onClose={() => {
            setOpenAddEditModal({ isShown: false, type: "add", data: null })
          }}
          getAllTravelStories={getStories}
        />
      </Modal>

      <button
        onClick={() => {setOpenAddEditModal({ isShown: true, type: "add", data: null })}}
        className="fixed bottom-10 right-10 bg-lime-400 hover:bg-lime-500 text-center rounded-full w-14 h-14 flex items-center justify-center leading-none p-0 m-0"
      >
        <MdAdd className="text-[32px] text-white" />
      </button>
    </div>
  )
}