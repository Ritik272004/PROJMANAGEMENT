export const UserRolesEnum = {
    ADMIN: "admin",
    PROJECT_ADMIN: "project_admin",
    MEMBER: "member"
}

export const AvailableUserRole = Object.values(UserRolesEnum) // it return Array of values.

export const TaskStatusEnum = {
    TODO : "todo",
    IN_PROGRESS : "in_progress",
    DONE : "done"
}

export const AvailableTaskStatues = Object.values(TaskStatusEnum);



/* We store values in this file that do not change across the app */