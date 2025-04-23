import { useState, useEffect } from "react"
import {
  MdAdd,
  MdClose,
  MdDeleteOutline,
  MdUpdate,
  MdOutlineAddPhotoAlternate,
  MdLocationOn,
} from "react-icons/md"
import DateSelector from "./DateSelector"
import axios from "axios"
import { toast } from "react-toastify"

const AddEditModal = ({
  type,
  onClose,
  getAllTravelStories,
  storyInfo = null,
}: any) => {
  // Initialize state with either data from storyInfo (edit) or empty values (add)
  const [title, setTitle] = useState("")
  const [story, setStory] = useState("")
  const [date, setDate] = useState(new Date())
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [locations, setLocations] = useState<string[]>([""])
  const [error, setError] = useState("")

  // Load story data when editing
  useEffect(() => {
    if (type === "edit" && storyInfo) {
      setTitle(storyInfo.title || "")
      setStory(storyInfo.story || "")
      setDate(storyInfo.visitedDate ? new Date(storyInfo.visitedDate) : new Date())
      setImagePreview(storyInfo.imageUrl || "")
      setLocations(
        storyInfo.visitedLocation && storyInfo.visitedLocation.length > 0
          ? storyInfo.visitedLocation
          : [""]
      )
    }
  }, [type, storyInfo])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  const handleAddOrEditStory = async () => {
    const filteredLocations = locations.filter((loc) => loc.trim() !== "")

    // Validation
    if (!title.trim()) {
      setError("Title is required")
      return
    }
    if (!story.trim()) {
      setError("Story is required")
      return
    }
    if (filteredLocations.length === 0) {
      setError("At least one destination is required")
      return
    }
    if (!imageFile && !imagePreview) {
      setError("An image is required")
      return
    }

    setError("")
    try {
      // 1. Upload image if a new file was selected
      let uploadedImageUrl = imagePreview
      if (imageFile) {
        const formData = new FormData()
        formData.append("image", imageFile)
        const uploadRes = await axios.post(
          "https://wanderlust-vert-nu.vercel.app/image-upload",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        )
        uploadedImageUrl = uploadRes.data.imageUrl
      }

      // 2. Prepare story payload
      const payload = {
        title,
        story,
        visitedDate: date.getTime().toString(),
        visitedLocation: filteredLocations,
        imageUrl: uploadedImageUrl,
      }

      // 3. Submit based on type (add or edit)
      if (type === "add") {
        await axios.post(
          "https://wanderlust-vert-nu.vercel.app/add-travelstory",
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        )
        toast.success("Story added successfully")
      } else {
        // For edit, use PUT and include the ID
        await axios.put(
          `https://wanderlust-vert-nu.vercel.app/edit-story/${storyInfo.id}`,
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        )
        toast.success("Story updated successfully")
      }

      // 4. Refresh list & close
      getAllTravelStories()
      onClose()
    } catch (e) {
      setError("Unable to save story. Please try again.")
    }
  }

  const handleDeleteStory = async () => {
    if (!storyInfo || !storyInfo.id) return

    try {
      await axios.delete(
        `https://wanderlust-vert-nu.vercel.app/delete-story/${storyInfo.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      )
      toast.success("Story deleted successfully")
      getAllTravelStories()
      onClose()
    } catch (e) {
      setError("Unable to delete story. Please try again.")
    }
  }

  const handleLocationChange = (index: number, value: string) => {
    const newLocations = [...locations]
    newLocations[index] = value
    setLocations(newLocations)
  }

  const addLocationField = () => {
    setLocations([...locations, ""])
  }

  const removeLocationField = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index)
    // Ensure there's always at least one field if the array becomes empty
    if (newLocations.length === 0) {
      setLocations([""])
    } else {
      setLocations(newLocations)
    }
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow-lg max-w-2xl w-full mx-auto">
      <div className="flex items-center justify-between">
        <h5 className="text-xl font-medium text-slate-500">
          {type === "add" ? "Add Story" : "Edit Story"}
        </h5>
        <div className="flex items-center gap-2">
          {type === "edit" && (
            <button
              className="flex items-center gap-1 text-xs font-medium bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white rounded px-3 py-2"
              onClick={handleDeleteStory}
            >
              <MdDeleteOutline className="text-lg" /> DELETE
            </button>
          )}
          <button className="text-slate-500 hover:text-slate-700" onClick={onClose}>
            <MdClose className="text-xl" />
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-red-500 text-sm mt-2 mb-4">{error}</div>
      )}

      {/* Form fields... */}
      <div className="flex-1 flex flex-col gap-2 pt-4">
        {/* TITLE */}
        <label className="text-xs text-slate-400">TITLE</label>
        <input
          type="text"
          className="text-2xl bg-white text-slate-950 outline-none border-b border-slate-200 pb-2"
          placeholder="A Wonderful Day"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* DATE */}
        <div className="my-3">
          <label className="text-xs text-slate-400 block mb-1">
            DATE VISITED
          </label>
          <DateSelector date={date} setDate={setDate} />
        </div>

        {/* DESTINATIONS */}
        <div className="my-3">
          <label className="text-xs text-slate-400 block mb-1">
            DESTINATIONS
          </label>
          {locations.map((location, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2 border border-slate-200 rounded-md p-2 flex-1">
                <MdLocationOn className="text-lime-500 text-lg" />
                <input
                  type="text"
                  className="flex-1 bg-white outline-none text-slate-700"
                  placeholder="Where did you go?"
                  value={location}
                  onChange={(e) =>
                    handleLocationChange(index, e.target.value)
                  }
                />
              </div>
              {locations.length > 1 && (
                <button
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-full"
                  onClick={() => removeLocationField(index)}
                >
                  <MdClose />
                </button>
              )}
            </div>
          ))}
          <button
            className="flex items-center gap-1 text-xs font-medium bg-lime-50 text-lime-400 border border-lime-100 hover:bg-lime-400 hover:text-white rounded px-3 py-[3px] mt-2"
            onClick={addLocationField}
          >
            <MdAdd className="text-lg" /> ADD LOCATION
          </button>
        </div>

        {/* IMAGE UPLOAD */}
        <div className="my-3">
          <label className="text-xs text-slate-400 block mb-1">
            UPLOAD IMAGE
          </label>
          <div className="border-2 border-dashed border-lime-200 rounded-lg p-4 text-center">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-60 mx-auto rounded-md object-cover"
                />
                <button
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                  onClick={() => {
                    setImagePreview("")
                    setImageFile(null)
                  }}
                >
                  <MdClose className="text-rose-500" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center py-6">
                <MdOutlineAddPhotoAlternate className="text-4xl text-lime-300 mb-2" />
                <span className="text-slate-500 text-sm">
                  Click to upload an image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
        </div>

        {/* STORY */}
        <div className="my-3">
          <label className="text-xs text-slate-400 block mb-1">STORY</label>
          <textarea
            className="w-full bg-white min-h-[150px] p-3 border border-slate-200 rounded-md outline-none text-slate-700 resize-none"
            placeholder="Share your travel experience..."
            value={story}
            onChange={(e) => setStory(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end mt-4">
          <button
            className="flex items-center gap-1 text-xs font-medium bg-lime-400 text-white rounded px-4 py-2 hover:bg-lime-500"
            onClick={handleAddOrEditStory}
          >
            {type === "add" ? <MdAdd /> : <MdUpdate />}
            {type === "add" ? "ADD STORY" : "UPDATE STORY"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddEditModal