import { Application } from "@hotwired/stimulus"
import PageController from "./controllers/page_controller.js"

const application = Application.start()
application.register("page", PageController)
