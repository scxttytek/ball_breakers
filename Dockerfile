FROM nginx:alpine

COPY index.html styles.css game.js /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
