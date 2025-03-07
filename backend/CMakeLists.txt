cmake_minimum_required(VERSION 3.18)
project(backend)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++20")

include_directories(
    "${PROJECT_SOURCE_DIR}/include"
    "${PROJECT_SOURCE_DIR}/lib"
)

file(
    GLOB
    SOURCES
    "src/**/*.cpp"
    "src/*.cpp"
)

set(
    PROJECT_LINK_LIBS
)

add_executable("${PROJECT_NAME}" ${SOURCES})
target_link_libraries("${PROJECT_NAME}" ${PROJECT_LINK_LIBS})
