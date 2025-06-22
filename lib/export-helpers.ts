import html2canvas from "html2canvas"
import { saveAs } from "file-saver"
import Docxtemplater from "docxtemplater"
import PizZip from "pizzip"

export async function exportToPNG(elementId: string, filename = "cv.png") {
  const element = document.getElementById(elementId)
  if (!element) throw new Error("Element not found")

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
  })

  canvas.toBlob((blob) => {
    if (blob) {
      saveAs(blob, filename)
    }
  }, "image/png")
}

export async function exportToJPG(elementId: string, filename = "cv.jpg") {
  const element = document.getElementById(elementId)
  if (!element) throw new Error("Element not found")

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
  })

  canvas.toBlob(
    (blob) => {
      if (blob) {
        saveAs(blob, filename)
      }
    },
    "image/jpeg",
    0.95,
  )
}

export async function exportToWord(cvData: any, filename = "cv.docx") {
  try {
    // Load template (you would need to create a Word template file)
    const response = await fetch("/templates/cv-template.docx")
    const templateBuffer = await response.arrayBuffer()

    const zip = new PizZip(templateBuffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    // Set template variables
    doc.setData({
      fullName: cvData.personalInfo?.fullName || "",
      email: cvData.personalInfo?.email || "",
      phone: cvData.personalInfo?.phone || "",
      address: cvData.personalInfo?.address || "",
      summary: cvData.summary || "",
      experience: cvData.experience || [],
      education: cvData.education || [],
      skills: cvData.skills || [],
      projects: cvData.projects || [],
    })

    doc.render()

    const buffer = doc.getZip().generate({
      type: "arraybuffer",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    saveAs(blob, filename)
  } catch (error) {
    console.error("Error exporting to Word:", error)
    throw error
  }
}
